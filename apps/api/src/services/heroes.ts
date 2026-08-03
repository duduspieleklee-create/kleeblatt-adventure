/** Hero-Service: Held anlegen (einmalig pro User) + Starter-Gear aus game-config.json. */

import type {
  CreateHeroInput,
  Hero,
  HeroClass,
  InventoryItem,
  ItemRarity,
  ItemSlot,
  ItemState,
} from "@kleeblatt/shared";
import { isHeroClass } from "@kleeblatt/shared";
import { eq } from "drizzle-orm";
import { getDb, isDbAvailable } from "../db/client.js";
import { heroes as heroesTable, items as itemsTable, type HeroRow } from "../db/schema.js";
import { loadGameConfig } from "../lib/gameConfig.js";
import { newId } from "../lib/ids.js";
import { memHeroes, memItems } from "./memoryStore.js";

/** Laut API-Vertrag: 2–20 Zeichen, alphanumerisch + Leerzeichen. */
const HERO_NAME_RE = /^[A-Za-z0-9 ]{2,20}$/;

export function validateHeroName(name: string): string | null {
  if (!name) return "Heldenname fehlt.";
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    return "Heldenname muss 2–20 Zeichen lang sein.";
  }
  if (!HERO_NAME_RE.test(trimmed)) {
    return "Heldenname: nur Buchstaben, Zahlen und Leerzeichen erlaubt.";
  }
  return null;
}

export function toHero(row: HeroRow): Hero {
  return {
    userId: row.userId,
    heroName: row.heroName,
    class: row.class as HeroClass,
    level: row.level,
    xp: row.xp,
    equipped: (row.equipped ?? {}) as Record<string, string>,
  };
}

export function buildStarterItems(heroClass: HeroClass): InventoryItem[] {
  const gear = loadGameConfig().starterGear[heroClass] ?? [];
  return gear.map((g) => ({
    itemId: newId("item"),
    templateId: g.templateId,
    name: g.name,
    slot: g.slot as ItemSlot,
    rarity: g.rarity as ItemRarity,
    state: g.state as ItemState,
    stats: g.stats,
    allowedClasses: (g.allowedClasses ?? null) as HeroClass[] | null,
    description: g.description ?? null,
    equipped: false,
  }));
}

export type CreateHeroResult =
  | { ok: true; hero: Hero; starterItems: InventoryItem[] }
  | { ok: false; status: 400 | 409; error: string };

export async function createHero(
  userId: string,
  input: CreateHeroInput,
): Promise<CreateHeroResult> {
  const nameError = validateHeroName(input.heroName);
  if (nameError) return { ok: false, status: 400, error: nameError };
  if (!isHeroClass(input.class)) {
    return { ok: false, status: 400, error: "Ungültige Klasse: mage | ranged | melee" };
  }

  const existing = await getHero(userId);
  if (existing) {
    return { ok: false, status: 409, error: "Held existiert bereits." };
  }

  const hero: Hero = {
    userId,
    heroName: input.heroName.trim(),
    class: input.class,
    level: 1,
    xp: 0,
    equipped: {},
  };
  const starterItems = buildStarterItems(input.class);

  if (await isDbAvailable()) {
    const db = getDb()!;
    await db.insert(heroesTable).values({
      userId: hero.userId,
      heroName: hero.heroName,
      class: hero.class,
      level: hero.level,
      xp: hero.xp,
      equipped: hero.equipped,
    });
    if (starterItems.length > 0) {
      await db.insert(itemsTable).values(
        starterItems.map((it) => ({
          id: it.itemId,
          userId,
          templateId: it.templateId,
          name: it.name,
          slot: it.slot,
          rarity: it.rarity,
          state: it.state,
          stats: it.stats,
          allowedClasses: it.allowedClasses,
          description: it.description,
          equipped: false,
        })),
      );
    }
  } else {
    memHeroes.set(userId, hero);
    for (const item of starterItems) {
      memItems.set(item.itemId, { ownerId: userId, item });
    }
  }

  return { ok: true, hero, starterItems };
}

export async function getHero(userId: string): Promise<Hero | null> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    const rows = await db.select().from(heroesTable).where(eq(heroesTable.userId, userId)).limit(1);
    return rows[0] ? toHero(rows[0]) : null;
  }
  return memHeroes.get(userId) ?? null;
}
