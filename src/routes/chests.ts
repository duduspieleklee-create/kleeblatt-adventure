/** Chest-Routen: GET /chests, POST /chests/:chestId/open (docs/architecture/24-api-contract.md §2.9). */

import { Hono } from "hono";
import { requireAuth, type AppVariables } from "../middleware/session.js";
import { listChests, openChest } from "../services/chests.js";

export const chestRoutes = new Hono<{ Variables: AppVariables }>();

chestRoutes.get("/chests", requireAuth, async (c) => {
  const user = c.get("user")!;
  const chests = await listChests(user.userId);
  return c.json({ chests });
});

chestRoutes.post("/chests/:chestId/open", requireAuth, async (c) => {
  const user = c.get("user")!;
  const chestId = c.req.param("chestId");

  const result = await openChest(user.userId, chestId);
  if (!result.ok) {
    const code = result.status === 404 ? "CHEST_NOT_FOUND" : "CHEST_ALREADY_OPENED";
    return c.json({ error: { code, message: result.error, retryable: false } }, result.status);
  }
  return c.json({ item: result.item }, 200);
});
