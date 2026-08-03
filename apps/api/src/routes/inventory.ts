/** Inventar-Routen: GET /inventory, POST /inventory/:itemId/equip|unequip. */

import { Hono } from "hono";
import { requireAuth, type AppVariables } from "../middleware/session.js";
import { equipItem, listItems, unequipItem } from "../services/items.js";

export const inventoryRoutes = new Hono<{ Variables: AppVariables }>();

inventoryRoutes.get("/inventory", requireAuth, async (c) => {
  const user = c.get("user")!;
  const items = await listItems(user.userId);
  return c.json({ items });
});

inventoryRoutes.post("/inventory/:itemId/equip", requireAuth, async (c) => {
  const user = c.get("user")!;
  const itemId = c.req.param("itemId");
  const result = await equipItem(user.userId, itemId);
  if (!result.ok) {
    const code = result.status === 404 ? "ITEM_NOT_FOUND" : "VALIDATION";
    return c.json({ error: { code, message: result.error, retryable: false } }, result.status);
  }
  return c.json({ hero: result.hero, items: result.inventory });
});

inventoryRoutes.post("/inventory/:itemId/unequip", requireAuth, async (c) => {
  const user = c.get("user")!;
  const itemId = c.req.param("itemId");
  const result = await unequipItem(user.userId, itemId);
  if (!result.ok) {
    const code = result.status === 404 ? "ITEM_NOT_FOUND" : "VALIDATION";
    return c.json({ error: { code, message: result.error, retryable: false } }, result.status);
  }
  return c.json({ hero: result.hero, items: result.inventory });
});
