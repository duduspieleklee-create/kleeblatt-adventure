/** Match-Routen: POST /match/start, POST /match/result (XP + Level-Up, server-authoritativ). */

import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AppVariables } from "../middleware/session.js";
import { startMatch, submitMatchResult } from "../services/match.js";

export const matchRoutes = new Hono<{ Variables: AppVariables }>();

const matchResultSchema = z.object({
  matchId: z.string().min(1, "matchId fehlt."),
  enemiesKilled: z.number().int().min(0).default(0),
  chestsOpened: z.number().int().min(0).default(0),
});

matchRoutes.post("/match/start", requireAuth, async (c) => {
  const user = c.get("user")!;
  const result = startMatch(user.userId);
  return c.json(result, 201);
});

matchRoutes.post("/match/result", requireAuth, async (c) => {
  const user = c.get("user")!;
  const body = (await c.req.json().catch(() => null)) as unknown;

  const parsed = matchResultSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ungültiger Request-Body.";
    return c.json({ error: { code: "VALIDATION", message, retryable: false } }, 400);
  }

  const result = await submitMatchResult(user.userId, parsed.data);
  if (!result.ok) {
    const code = result.status === 404 ? "HERO_NOT_FOUND" : "VALIDATION";
    return c.json({ error: { code, message: result.error, retryable: false } }, result.status);
  }
  return c.json(result.result, 200);
});
