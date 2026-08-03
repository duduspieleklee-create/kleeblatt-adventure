/** Hero-Routen: POST /hero (anlegen), GET /hero (lesen). */

import { Hono } from "hono";
import type { HeroResponse } from "@kleeblatt/shared";
import { requireAuth, type AppVariables } from "../middleware/session.js";
import { createHeroSchema, type CreateHeroBody } from "../lib/validation.js";
import { createHero, getHero } from "../services/heroes.js";

export const heroRoutes = new Hono<{ Variables: AppVariables }>();

heroRoutes.post("/hero", requireAuth, async (c) => {
  const user = c.get("user")!;
  const body = (await c.req.json().catch(() => null)) as unknown;

  const parsed = createHeroSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ungültiger Request-Body.";
    return c.json({ error: { code: "VALIDATION", message, retryable: false } }, 400);
  }

  const input: CreateHeroBody = parsed.data;
  const result = await createHero(user.userId, input);
  if (!result.ok) {
    const code = result.status === 409 ? "HERO_EXISTS" : "VALIDATION";
    return c.json({ error: { code, message: result.error, retryable: false } }, result.status);
  }

  const response: HeroResponse = {
    ...result.hero,
    starterItems: result.starterItems,
  };
  return c.json(response, 201);
});

heroRoutes.get("/hero", requireAuth, async (c) => {
  const user = c.get("user")!;
  const hero = await getHero(user.userId);
  return c.json(hero ?? null);
});
