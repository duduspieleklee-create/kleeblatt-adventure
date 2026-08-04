/**
 * Chest-Service: Kisten listen + einmalige Weighted-Loot-Rolls.
 *
 * Server-authoritativ (docs/architecture/24-api-contract.md §2.9):
 * - GET /chests → Kisten + opened-Status (chest_opens)
 * - POST /chests/:chestId/open → Weighted-Roll aus game-config.json
 *   → lootTables, Item in items (State "web2"), chest_opens-Eintrag
 *   (Unique Constraint verhindert Doppel-Open).
 */

import type { HeroClass, InventoryItem, ItemSlot } from "@kleeblatt/shared";
import { and, eq } from "drizzle-orm";
import { getDb, isDbAvailable } from "../db/client.js";
import { chestOpens as chestOpensTable, items as itemsTable } from "../db/schema.js";
import { loadGameConfig, type LootEntry, type LootTable } from "../lib/gameConfig.js";
import { newId } from "../lib/ids.js";
import { memChestOpens, memItems } from "./memoryStore.js";

export interface ChestInfo {
  chestId: string;
  x: number;
  y: number;
  opened: boolean;
}

/** Prototyp-Positionen der Kisten (Map ist noch nicht server-seitig; Werte aus Contract §2.9). */
const CHEST_POSITIONS: Record<string, { x: number; y: number }> = {
  prototype_chest: { x: 480, y: 360 },
  prototype_chest_02: { x: 720, y: 240 },
  prototype_chest_03: { x: 900, y: 640 },
};

/** Weighted Loot-Roll: wählt einen Eintrag proportional zu seiner weight. */
export function rollLootEntry(entries: LootEntry[]): LootEntry {
  const total = entries.reduce((sum, e) => sum + Math.max(0, e.weight), 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1]!;
}

async function isChestOpened(userId: string, chestId: string): Promise<boolean> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    const rows = await db
      .select({ id: chestOpensTable.chestId })
      .from(chestOpensTable)
      .where(and(eq(chestOpensTable.userId, userId), eq(chestOpensTable.chestId, chestId)))
      .limit(1);
    return rows.length > 0;
  }
  return memChestOpens.has(`${userId}:${chestId}`);
}

export async function listChests(userId: string): Promise<ChestInfo[]> {
  const config = loadGameConfig();
  const chests: ChestInfo[] = [];
  for (const chestId of Object.keys(config.lootTables)) {
    const pos = CHEST_POSITIONS[chestId] ?? CHEST_POSITIONS.prototype_chest!;
    chests.push({
      chestId,
      x: pos.x,
      y: pos.y,
      opened: await isChestOpened(userId, chestId),
    });
  }
  return chests;
}

export type OpenChestResult =
  { ok: true; item: InventoryItem } | { ok: false; status: 404 | 409; error: string };

export async function openChest(userId: string, chestId: string): Promise<OpenChestResult> {
  const config = loadGameConfig();
  const table: LootTable | undefined = config.lootTables[chestId];
  if (!table) return { ok: false, status: 404, error: "Kiste existiert nicht." };

  if (await isChestOpened(userId, chestId)) {
    return { ok: false, status: 409, error: "Kiste bereits geöffnet." };
  }

  const entry = rollLootEntry(table.entries);
  const item: InventoryItem = {
    itemId: newId("item"),
    templateId: entry.templateId,
    name: entry.name,
    slot: entry.slot as ItemSlot,
    rarity: entry.rarity as InventoryItem["rarity"],
    state: "web2",
    stats: entry.stats ?? {},
    allowedClasses: (entry.allowedClasses ?? null) as HeroClass[] | null,
    description: null,
    equipped: false,
  };

  if (await isDbAvailable()) {
    const db = getDb()!;
    try {
      await db.insert(itemsTable).values({
        id: item.itemId,
        userId,
        templateId: item.templateId,
        name: item.name,
        slot: item.slot,
        rarity: item.rarity,
        state: item.state,
        stats: item.stats,
        allowedClasses: item.allowedClasses,
        description: item.description,
        equipped: false,
      });
      await db.insert(chestOpensTable).values({ userId, chestId });
    } catch {
      // Unique-Verletzung (Race): Kiste wurde parallel geöffnet.
      return { ok: false, status: 409, error: "Kiste bereits geöffnet." };
    }
  } else {
    memItems.set(item.itemId, { ownerId: userId, item });
    memChestOpens.set(`${userId}:${chestId}`, new Date().toISOString());
  }

  return { ok: true, item };
}
