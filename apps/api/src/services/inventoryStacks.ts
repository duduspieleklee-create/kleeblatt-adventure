/** Material / consumable stack bag per user (Rucksack stacks). */

import type { InventoryStacks } from "@kleeblatt/shared";
import { eq } from "drizzle-orm";
import { getDb, isDbAvailable } from "../db/client.js";
import { inventoryStacks as stacksTable } from "../db/schema.js";
import { memInventoryStacks } from "./memoryStore.js";

function sanitize(stacks: InventoryStacks): InventoryStacks {
  const out: InventoryStacks = {};
  for (const [k, v] of Object.entries(stacks)) {
    if (typeof k !== "string" || !k || k.length > 64) continue;
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    const n = Math.floor(v);
    if (n > 0 && n <= 9999) out[k] = n;
  }
  return out;
}

export async function getStacks(
  userId: string,
): Promise<{ stacks: InventoryStacks; updatedAt: string | null }> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    const rows = await db
      .select()
      .from(stacksTable)
      .where(eq(stacksTable.userId, userId))
      .limit(1);
    const row = rows[0];
    if (!row) return { stacks: {}, updatedAt: null };
    return {
      stacks: sanitize((row.stacks ?? {}) as InventoryStacks),
      updatedAt: row.updatedAt?.toISOString?.() ?? null,
    };
  }

  const entry = memInventoryStacks.get(userId);
  if (!entry) return { stacks: {}, updatedAt: null };
  return { stacks: sanitize(entry.stacks), updatedAt: entry.updatedAt };
}

export async function putStacks(
  userId: string,
  stacks: InventoryStacks,
): Promise<{ stacks: InventoryStacks; updatedAt: string }> {
  const clean = sanitize(stacks);
  const now = new Date();

  if (await isDbAvailable()) {
    const db = getDb()!;
    await db
      .insert(stacksTable)
      .values({
        userId,
        stacks: clean,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: stacksTable.userId,
        set: { stacks: clean, updatedAt: now },
      });
    return { stacks: clean, updatedAt: now.toISOString() };
  }

  memInventoryStacks.set(userId, { stacks: clean, updatedAt: now.toISOString() });
  return { stacks: clean, updatedAt: now.toISOString() };
}
