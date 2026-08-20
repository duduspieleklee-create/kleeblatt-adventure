import { Hono } from "hono";
import type { MeResponse } from "@kleeblatt/shared";
import { requireAuth, type AppVariables } from "../middleware/session.js";
import { getHero } from "../services/heroes.js";

export const meRoutes = new Hono<{ Variables: AppVariables }>();

meRoutes.get("/me", requireAuth, async (c) => {
  const user = c.get("user")!;
  const hero = await getHero(user.userId);
  const body: MeResponse = {
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    picture: user.picture,
    hero,
    guest: user.guest,
  };
  return c.json(body);
});
