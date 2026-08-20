/** Auth-Routen: Google OAuth (start/callback), Logout, Dev-Login, Status. */

import { randomBytes } from "node:crypto";
import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME, type MeResponse, type SessionUser } from "@kleeblatt/shared";
import { env, sessionCookie } from "../config/env.js";
import { signSession } from "../lib/jwt.js";
import { upsertGoogleUser, createEmailUser, createGuestUser, upgradeGuestUser, getUserByEmail, verifyEmailPassword } from "../services/users.js";
import { getOrCreateWallet } from "../services/wallets.js";
import { getHero } from "../services/heroes.js";
import { hashPassword } from "../lib/password.js";
import { registerSchema, loginSchema, emailSchema } from "../lib/validation.js";
import { requireAuth, type AppVariables } from "../middleware/session.js";

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

    await getOrCreateWallet(user.userId);
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

/** Build a MeResponse (mirrors /me) including the optional hero. */
async function buildMe(user: SessionUser): Promise<MeResponse> {
  const hero = await getHero(user.userId);
  return {
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    picture: user.picture,
    hero,
    guest: user.guest,
  };
}

/** POST /auth/register — create an email/password account and start a session. */
authRoutes.post("/auth/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION",
          message: parsed.error.issues[0]?.message ?? "Invalid input.",
          retryable: false,
        },
      },
      400,
    );
  }
  const { email, password } = parsed.data;

  const existing = await getUserByEmail(email);
  if (existing) {
    return c.json(
      {
        error: {
          code: "EMAIL_TAKEN",
          message: "This email is already registered.",
          retryable: false,
        },
      },
      409,
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await createEmailUser({ email, passwordHash });
  await getOrCreateWallet(user.userId);
  const jwt = await signSession(user);
  setCookie(c, SESSION_COOKIE_NAME, jwt, cookieOpts());
  return c.json({ ok: true, me: await buildMe(user) }, 201);
});

/** POST /auth/login — verify email + password and start a session. */
authRoutes.post("/auth/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION", message: "Invalid email or password.", retryable: false } },
      400,
    );
  }
  const { email, password } = parsed.data;

  const user = await verifyEmailPassword(email, password);
  if (!user) {
    return c.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password.", retryable: false } },
      401,
    );
  }

  const jwt = await signSession(user);
  setCookie(c, SESSION_COOKIE_NAME, jwt, cookieOpts());
  return c.json({ ok: true, me: await buildMe(user) }, 200);
});

/** POST /auth/guest — create a temporary guest account and start a session. */
authRoutes.post("/auth/guest", async (c) => {
  const guest = await createGuestUser();
  await getOrCreateWallet(guest.userId);
  const jwt = await signSession(guest);
  setCookie(c, SESSION_COOKIE_NAME, jwt, cookieOpts());
  return c.json({ ok: true, me: await buildMe(guest) }, 201);
});

/**
 * POST /auth/upgrade — turn the current guest session into a full
 * email/password account in place (progress is preserved).
 */
authRoutes.post("/auth/upgrade", requireAuth, async (c) => {
  const current = c.get("user")!;
  if (!current.guest) {
    return c.json(
      { error: { code: "NOT_GUEST", message: "Only guest accounts can be upgraded.", retryable: false } },
      400,
    );
  }
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION", message: "Invalid email or password.", retryable: false } },
      400,
    );
  }
  const { email, password } = parsed.data;
  const existing = await getUserByEmail(email);
  if (existing) {
    return c.json(
      { error: { code: "EMAIL_TAKEN", message: "This email is already registered.", retryable: false } },
      409,
    );
  }
  const passwordHash = await hashPassword(password);
  const updated = await upgradeGuestUser(current.userId, email, passwordHash);
  if (!updated) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Guest account not found.", retryable: false } },
      404,
    );
  }
  const jwt = await signSession(updated);
  setCookie(c, SESSION_COOKIE_NAME, jwt, cookieOpts());
  return c.json({ ok: true, me: await buildMe(updated) }, 200);
});

/** GET /auth/check-email?email= — availability check for the registration form. */
authRoutes.get("/auth/check-email", async (c) => {
  const raw = c.req.query("email") ?? "";
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ available: false, valid: false });
  }
  const existing = await getUserByEmail(parsed.data);
  return c.json({ available: !existing, valid: true });
});

/** POST /auth/supabase — bridge a Supabase JWT (Web3/SIWE login) into an app session. */
authRoutes.post("/auth/supabase", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body.access_token !== "string") {
    return c.json(
      { error: { code: "VALIDATION", message: "access_token required", retryable: false } },
      400,
    );
  }
  if (!env.supabaseJwtSecret) {
    return c.json(
      { error: { code: "NOT_CONFIGURED", message: "Supabase JWT secret not configured", retryable: false } },
      503,
    );
  }

  try {
    const { payload } = await jwtVerify(
      body.access_token,
      new TextEncoder().encode(env.supabaseJwtSecret),
    );
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!userId || !email) {
      return c.json(
        { error: { code: "INVALID_TOKEN", message: "Missing user id or email", retryable: false } },
        401,
      );
    }

    const meta = (payload.user_metadata ?? {}) as Record<string, unknown>;
    const displayName =
      typeof meta.preferred_username === "string"
        ? meta.preferred_username
        : typeof meta.username === "string"
          ? meta.username
          : typeof meta.display_name === "string"
            ? meta.display_name
            : email.split("@")[0] ?? null;
    const picture = typeof meta.picture === "string" ? meta.picture : null;

    const user: SessionUser = { userId, email, displayName, picture, guest: false };
    await getOrCreateWallet(user.userId);
    const jwt = await signSession(user);
    setCookie(c, SESSION_COOKIE_NAME, jwt, cookieOpts());
    return c.json({ ok: true, me: await buildMe(user) }, 200);
  } catch (err) {
    console.error("[auth] Supabase bridge error:", err);
    return c.json(
      { error: { code: "INVALID_TOKEN", message: "Supabase token verification failed", retryable: false } },
      401,
    );
  }
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
  await getOrCreateWallet(user.userId);
  const jwt = await signSession(user);
  setCookie(c, SESSION_COOKIE_NAME, jwt, cookieOpts());
  return c.redirect(`${env.webUrl}/?auth=ok`);
});
