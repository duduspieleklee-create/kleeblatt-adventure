import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { SESSION_COOKIE_NAME } from "@kleeblatt/shared";
import { env, sessionCookie } from "../config/env.js";
import { signSession } from "../lib/jwt.js";
import { upsertGoogleUser } from "../services/users.js";
import type { AppVariables } from "../middleware/session.js";

export const authRoutes = new Hono<{ Variables: AppVariables }>();

function cookieOpts() {
  return {
    httpOnly: sessionCookie.httpOnly,
    path: sessionCookie.path,
    maxAge: sessionCookie.ttlSeconds,
    sameSite: sessionCookie.sameSite,
    secure: sessionCookie.secure,
  } as const;
}

function googleConfigured(): boolean {
  return Boolean(env.googleClientId && env.googleClientSecret);
}

/** GET /auth/google – start OAuth */
authRoutes.get("/auth/google", (c) => {
  if (!googleConfigured()) {
    return c.json(
      {
        error: {
          code: "AUTH_NOT_CONFIGURED",
          message: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing",
          retryable: false,
        },
      },
      503,
    );
  }

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleCallbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/** GET /auth/google/callback */
authRoutes.get("/auth/google/callback", async (c) => {
  const code = c.req.query("code");
  const oauthError = c.req.query("error");
  if (oauthError || !code) {
    return c.redirect(`${env.webUrl}/?auth=error`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        redirect_uri: env.googleCallbackUrl,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      console.error("Google token exchange failed", await tokenRes.text());
      return c.redirect(`${env.webUrl}/?auth=error`);
    }
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      return c.redirect(`${env.webUrl}/?auth=error`);
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!profileRes.ok) {
      console.error("Google profile failed", await profileRes.text());
      return c.redirect(`${env.webUrl}/?auth=error`);
    }
    const profile = (await profileRes.json()) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    const user = upsertGoogleUser({
      googleId: profile.id,
      email: profile.email,
      displayName: profile.name ?? null,
      picture: profile.picture ?? null,
    });

    const jwt = await signSession(user);
    setCookie(c, SESSION_COOKIE_NAME, jwt, cookieOpts());
    return c.redirect(`${env.webUrl}/?auth=ok`);
  } catch (err) {
    console.error("OAuth callback error", err);
    return c.redirect(`${env.webUrl}/?auth=error`);
  }
});

/** POST /auth/logout */
authRoutes.post("/auth/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: sessionCookie.path });
  return c.json({ ok: true });
});

/**
 * GET /auth/dev-login – local only when AUTH_DEV_BYPASS=true
 * Creates a mock session without Google (for UI/API development).
 */
authRoutes.get("/auth/dev-login", async (c) => {
  if (env.nodeEnv === "production" || !env.authDevBypass) {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Dev login disabled", retryable: false } },
      403,
    );
  }
  const user = upsertGoogleUser({
    googleId: "dev-local",
    email: "dev@localhost",
    displayName: "Dev Player",
    picture: null,
  });
  const jwt = await signSession(user);
  setCookie(c, SESSION_COOKIE_NAME, jwt, cookieOpts());
  return c.redirect(`${env.webUrl}/?auth=ok`);
});
