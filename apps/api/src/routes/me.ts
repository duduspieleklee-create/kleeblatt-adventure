import { Hono } from "hono";
import type { MeResponse } from "@kleeblatt/shared";
import { requireAuth, type AppVariables } from "../middleware/session.js";

export const meRoutes = new Hono<{ Variables: AppVariables }>();

meRoutes.get("/me", requireAuth, (c) => {
  const user = c.get("user")!;
  const body: MeResponse = {
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    picture: user.picture,
    hero: null,
  };
  return c.json(body);
});
