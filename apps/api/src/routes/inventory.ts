/** Inventar-Routen: GET /inventory, stacks, POST equip|unequip. */

import { Hono } from "hono";
import type { InventoryStacks } from "@kleeblatt/shared";
import { requireAuth, type AppVariables } from "../middleware/session.js";
import { equipItem, listItems, unequipItem } from "../services/items.js";
import { getStacks, putStacks } from "../services/inventoryStacks.js";

export const inventoryRoutes = new Hono<{ Variables: AppVariables }>();

inventoryRoutes.get("/inventory", requireAuth, async (c) => {
  const user = c.get("user")!;
  const items = await listItems(user.userId);
  return c.json({ items });
});

/** Material / consumable stacks (Rucksack). */
inventoryRoutes.get("/inventory/stacks", requireAuth, async (c) => {
  const user = c.get("user")!;
  const result = await getStacks(user.userId);
  return c.json({ stacks: result.stacks, updatedAt: result.updatedAt });
});

inventoryRoutes.put("/inventory/stacks", requireAuth, async (c) => {
  const user = c.get("user")!;
  const body = (await c.req.json().catch(() => null)) as { stacks?: InventoryStacks } | null;
  if (!body || typeof body.stacks !== "object" || body.stacks === null || Array.isArray(body.stacks)) {
    return c.json(
      { error: { code: "VALIDATION", message: "Body muss { stacks: Record<string, number> } sein.", retryable: false } },
      400,
    );
  }
  const result = await putStacks(user.userId, body.stacks);
  return c.json({ stacks: result.stacks, updatedAt: result.updatedAt });
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
