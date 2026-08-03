import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { SessionUser } from "@kleeblatt/shared";
import { SESSION_COOKIE_NAME } from "@kleeblatt/shared";
import { verifySession } from "../lib/jwt.js";

export type AppVariables = {
  user: SessionUser | null;
};

/** Attach optional session user from JWT cookie. */
export const loadSession = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  const user = token ? await verifySession(token) : null;
  c.set("user", user);
  await next();
});

/** Require authenticated session – 401 otherwise. */
export const requireAuth = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Login required", retryable: false } },
      401,
    );
  }
  await next();
});
