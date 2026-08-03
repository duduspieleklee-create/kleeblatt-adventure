/** Auth-Routen: Google OAuth (start/callback), Logout, Dev-Login, Status. */

import { randomBytes } from "node:crypto";
import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { SESSION_COOKIE_NAME } from "@kleeblatt/shared";
import { env, sessionCookie } from "../config/env.js";
import { signSession } from "../lib/jwt.js";
import { upsertGoogleUser } from "../services/users.js";
import type { AppVariables } from "../middleware/session.js";

export const authRoutes = new Hono<{ Variables: AppVariables }>();

/** Kurzlebiges CSRF-Cookie für den OAuth-state (nur an den Callback gesendet). */
const STATE_COOKIE = "kleeblatt_oauth_state";
const STATE_COOKIE_PATH = "/auth/google/callback";
const STATE_TTL_SECONDS = 600; // 10 Minuten

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

/** Fehler-Redirect mit Grund, damit Produktionsfehler diagnostizierbar sind. */
function errorRedirect(
  c: Context<{ Variables: AppVariables }>,
  reason: string,
  detail?: string,
): Response {
  const params = new URLSearchParams({ auth: "error", reason });
  if (detail) params.set("detail", detail.slice(0, 80));
  // c.redirect statt rohem Response: so bleiben Cookie-Header (deleteCookie)
  // des Hono-Kontexts erhalten.
  return c.redirect(`${env.webUrl}/?${params.toString()}`, 302);
}

/** GET /auth/status – nicht-sekrete Auth-Konfiguration (Remote-Diagnose). */
authRoutes.get("/auth/status", (c) =>
  c.json({
    configured: googleConfigured(),
    clientIdSet: Boolean(env.googleClientId),
    clientSecretSet: Boolean(env.googleClientSecret),
    callbackUrl: env.googleCallbackUrl,
    webUrl: env.webUrl,
    cookieSecure: sessionCookie.secure,
    nodeEnv: env.nodeEnv,
  }),
);

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

  // OAuth state (CSRF-Schutz): kurzlebiges httpOnly-Cookie, im Callback geprüft.
  const state = randomBytes(24).toString("hex");
  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "Lax",
    path: STATE_COOKIE_PATH,
    maxAge: STATE_TTL_SECONDS,
    secure: sessionCookie.secure,
  });

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleCallbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/** GET /auth/google/callback */
authRoutes.get("/auth/google/callback", async (c) => {
  const code = c.req.query("code");
  const oauthError = c.req.query("error");
  const state = c.req.query("state");
  const stateCookie = getCookie(c, STATE_COOKIE);
  deleteCookie(c, STATE_COOKIE, { path: STATE_COOKIE_PATH });

  // Google hat direkt einen Fehler zurückgegeben (z.B. Nutzer abgebrochen /
  // redirect_uri_mismatch). Detail durchreichen, damit der Grund sichtbar wird.
  if (oauthError) {
    console.warn(`[auth] Google OAuth error: ${oauthError}`);
    return errorRedirect(c, "oauth", oauthError);
  }
  if (!code) {
    return errorRedirect(c, "missing_code");
  }
  // CSRF-Schutz: state muss zum Cookie passen.
  if (!stateCookie || !state || stateCookie !== state) {
    console.warn("[auth] OAuth state mismatch (CSRF?) – Login abgebrochen.");
    return errorRedirect(c, "state");
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
      const body = await tokenRes.text();
      console.error(`[auth] Google token exchange failed (${tokenRes.status}): ${body}`);
      return errorRedirect(c, "token_exchange", body);
    }
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      return errorRedirect(c, "token_exchange", "missing access_token");
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!profileRes.ok) {
      const body = await profileRes.text();
      console.error(`[auth] Google profile failed (${profileRes.status}): ${body}`);
      return errorRedirect(c, "profile", body);
    }
    const profile = (await profileRes.json()) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    const user = await upsertGoogleUser({
      googleId: profile.id,
      email: profile.email,
      displayName: profile.name ?? null,
      picture: profile.picture ?? null,
    });

    const jwt = await signSession(user);
    setCookie(c, SESSION_COOKIE_NAME, jwt, cookieOpts());
    return c.redirect(`${env.webUrl}/?auth=ok`);
  } catch (err) {
    console.error("[auth] OAuth callback error", err);
    return errorRedirect(c, "exception", err instanceof Error ? err.message : undefined);
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
  const user = await upsertGoogleUser({
    googleId: "dev-local",
    email: "dev@localhost",
    displayName: "Dev Player",
    picture: null,
  });
  const jwt = await signSession(user);
  setCookie(c, SESSION_COOKIE_NAME, jwt, cookieOpts());
  return c.redirect(`${env.webUrl}/?auth=ok`);
});
