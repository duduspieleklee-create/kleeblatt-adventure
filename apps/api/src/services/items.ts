/** Item-Service: Inventar listen, Items an-/ablegen (Equip-Regeln). */

import type { Hero, InventoryItem, ItemSlot } from "@kleeblatt/shared";
import { eq } from "drizzle-orm";
import { getDb, isDbAvailable } from "../db/client.js";
import { heroes as heroesTable, items as itemsTable, type ItemRow } from "../db/schema.js";
import { getHero } from "./heroes.js";
import { memItems } from "./memoryStore.js";

function toInventoryItem(row: ItemRow): InventoryItem {
  return {
    itemId: row.id,
    templateId: row.templateId,
    name: row.name,
    slot: (row.slot ?? null) as ItemSlot | null,
    rarity: row.rarity as InventoryItem["rarity"],
    state: row.state as InventoryItem["state"],
    stats: (row.stats ?? {}) as Record<string, number>,
    allowedClasses: (row.allowedClasses ?? null) as InventoryItem["allowedClasses"],
    description: row.description ?? null,
    equipped: row.equipped,
  };
}

export async function listItems(userId: string): Promise<InventoryItem[]> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    const rows = await db.select().from(itemsTable).where(eq(itemsTable.userId, userId));
    return rows.map(toInventoryItem).sort((a, b) => a.name.localeCompare(b.name, "de"));
  }
  return [...memItems.values()]
    .filter((entry) => entry.ownerId === userId)
    .map((entry) => entry.item)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export type EquipResult =
  | { ok: true; hero: Hero; inventory: InventoryItem[] }
  | { ok: false; status: 400 | 404; error: string };

export async function equipItem(userId: string, itemId: string): Promise<EquipResult> {
  const hero = await getHero(userId);
  if (!hero) return { ok: false, status: 404, error: "Kein Held vorhanden." };

  const item = await findOwnedItem(userId, itemId);
  if (!item) return { ok: false, status: 404, error: "Item nicht gefunden." };
  if (item.equipped) return { ok: false, status: 400, error: "Item ist bereits angelegt." };
  if (!item.slot) return { ok: false, status: 400, error: "Item kann nicht angelegt werden." };
  if (item.allowedClasses && !item.allowedClasses.includes(hero.class)) {
    return { ok: false, status: 400, error: `Nicht für die Klasse ${hero.class} geeignet.` };
  }

  // Bisheriges Item im Slot ablegen, neues anlegen.
  const previousId = hero.equipped[item.slot];

  if (await isDbAvailable()) {
    const db = getDb()!;
    const nextEquipped = { ...hero.equipped, [item.slot]: item.itemId };
    if (previousId) {
      await db.update(itemsTable).set({ equipped: false }).where(eq(itemsTable.id, previousId));
    }
    await db.update(itemsTable).set({ equipped: true }).where(eq(itemsTable.id, itemId));
    await db
      .update(heroesTable)
      .set({ equipped: nextEquipped })
      .where(eq(heroesTable.userId, userId));
  } else {
    const prev = previousId ? memItems.get(previousId) : undefined;
    if (prev) prev.item.equipped = false;
    const cur = memItems.get(itemId);
    if (cur) cur.item.equipped = true;
    hero.equipped = { ...hero.equipped, [item.slot]: item.itemId };
  }

  const freshHero = (await getHero(userId)) ?? hero;
  const inventory = await listItems(userId);
  return { ok: true, hero: freshHero, inventory };
}

export async function unequipItem(userId: string, itemId: string): Promise<EquipResult> {
  const hero = await getHero(userId);
  if (!hero) return { ok: false, status: 404, error: "Kein Held vorhanden." };

  const item = await findOwnedItem(userId, itemId);
  if (!item) return { ok: false, status: 404, error: "Item nicht gefunden." };
  if (!item.equipped) return { ok: false, status: 400, error: "Item ist nicht angelegt." };

  const nextEquipped: Record<string, string> = {};
  for (const [slot, id] of Object.entries(hero.equipped)) {
    if (id !== itemId) nextEquipped[slot] = id;
  }

  if (await isDbAvailable()) {
    const db = getDb()!;
    await db.update(itemsTable).set({ equipped: false }).where(eq(itemsTable.id, itemId));
    await db
      .update(heroesTable)
      .set({ equipped: nextEquipped })
      .where(eq(heroesTable.userId, userId));
  } else {
    const cur = memItems.get(itemId);
    if (cur) cur.item.equipped = false;
    hero.equipped = nextEquipped;
  }

  const freshHero = (await getHero(userId)) ?? hero;
  const inventory = await listItems(userId);
  return { ok: true, hero: freshHero, inventory };
}

async function findOwnedItem(userId: string, itemId: string): Promise<InventoryItem | null> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    const rows = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId)).limit(1);
    const row = rows[0];
    if (!row || row.userId !== userId) return null;
    return toInventoryItem(row);
  }
  const entry = memItems.get(itemId);
  return entry && entry.ownerId === userId ? entry.item : null;
}
