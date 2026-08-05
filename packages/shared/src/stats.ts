/**
 * Stat-Stacking: final = base + gear + levelBonus (additiv).
 * Source of truth: game-config.json → statStacking / hero.classes / hero.levelBonuses.
 * Ref: docs/architecture/21-game-config.md (Abschnitt 4)
 */

import type { HeroClass } from "./types/hero.js";
import type { InventoryItem } from "./types/item.js";

/** Basis-Stats pro Klasse (game-config.json → hero.classes.<id>.baseStats). */
export const HERO_CLASS_BASE_STATS: Record<HeroClass, { maxHp: number; atk: number; speed: number }> = {
  melee: { maxHp: 120, atk: 15, speed: 100 },
  ranged: { maxHp: 90, atk: 12, speed: 110 },
  mage: { maxHp: 80, atk: 14, speed: 100 },
};

/** Pro-Level-Boni (game-config.json → hero.levelBonuses). */
export const HERO_LEVEL_BONUSES = {
  hpPerLevel: 12,
  atkPerLevel: 2,
};

export interface FinalStats {
  maxHp: number;
  atk: number;
  speed: number;
  /** Summe der Gear-Stat-Beiträge (Debug/Test). */
  gearBonus: { maxHp: number; atk: number; speed: number };
}

/**
 * Berechnet die finalen Held-Stats nach der additiven Formel:
 * final = base(heroClass) + gear(ausgerüstete Items) + (level - 1) * levelBonus.
 * Nicht-ausgerüstete Items werden ignoriert.
 */
export function computeFinalStats(
  heroClass: HeroClass,
  level: number,
  equippedItems: Pick<InventoryItem, "equipped" | "stats">[],
): FinalStats {
  const base = HERO_CLASS_BASE_STATS[heroClass];
  const levelBonus = Math.max(0, level - 1);

  const gearBonus = { maxHp: 0, atk: 0, speed: 0 };
  for (const item of equippedItems) {
    if (!item.equipped) continue;
    gearBonus.maxHp += item.stats?.maxHp ?? 0;
    gearBonus.atk += item.stats?.atk ?? 0;
    gearBonus.speed += item.stats?.speed ?? 0;
  }

  return {
    maxHp: base.maxHp + gearBonus.maxHp + levelBonus * HERO_LEVEL_BONUSES.hpPerLevel,
    atk: base.atk + gearBonus.atk + levelBonus * HERO_LEVEL_BONUSES.atkPerLevel,
    speed: base.speed + gearBonus.speed,
    gearBonus,
  };
}

/** Bequemer Wrapper: aus einem Hero + Inventar die finalen Stats holen. */
export function computeHeroFinalStats(
  heroClass: HeroClass,
  level: number,
  inventory: Pick<InventoryItem, "equipped" | "stats">[],
): FinalStats {
  return computeFinalStats(heroClass, level, inventory);
}
