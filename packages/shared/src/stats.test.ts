import { describe, expect, it } from "vitest";
import { computeFinalStats, HERO_CLASS_BASE_STATS, HERO_LEVEL_BONUSES } from "./stats.js";

describe("computeFinalStats (statStacking: base + gear + levelBonus)", () => {
  it("Level 1 ohne Gear = reine Basis-Stats", () => {
    const stats = computeFinalStats("melee", 1, []);
    expect(stats).toEqual({
      maxHp: HERO_CLASS_BASE_STATS.melee.maxHp,
      atk: HERO_CLASS_BASE_STATS.melee.atk,
      speed: HERO_CLASS_BASE_STATS.melee.speed,
      gearBonus: { maxHp: 0, atk: 0, speed: 0 },
    });
  });

  it("Level-Bonus wird additiv dazugerechnet", () => {
    const stats = computeFinalStats("mage", 4, []);
    expect(stats.maxHp).toBe(HERO_CLASS_BASE_STATS.mage.maxHp + 3 * HERO_LEVEL_BONUSES.hpPerLevel);
    expect(stats.atk).toBe(HERO_CLASS_BASE_STATS.mage.atk + 3 * HERO_LEVEL_BONUSES.atkPerLevel);
  });

  it("Gear-Stats werden nur für ausgerüstete Items addiert", () => {
    const sword = { equipped: true, stats: { atk: 5, maxHp: 0, speed: 0 } };
    const pouch = { equipped: false, stats: { atk: 99, maxHp: 0, speed: 0 } };
    const stats = computeFinalStats("ranged", 2, [sword, pouch]);
    expect(stats.atk).toBe(HERO_CLASS_BASE_STATS.ranged.atk + 1 * HERO_LEVEL_BONUSES.atkPerLevel + 5);
    expect(stats.gearBonus.atk).toBe(5);
  });

  it("Level 0 wird wie Level 1 behandelt (kein negativer Bonus)", () => {
    const stats = computeFinalStats("melee", 0, []);
    expect(stats.maxHp).toBe(HERO_CLASS_BASE_STATS.melee.maxHp);
  });
});
