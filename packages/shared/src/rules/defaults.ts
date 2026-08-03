/** Default skill definitions and class → skill mappings (docs/architecture/19-phaser-rule-engine.md §4, §7) */

import type { SkillDefMap, SkillId } from "./types.js";

export const DEFAULT_SKILLS: SkillDefMap = {
  dash: {
    id: "dash",
    cdMs: 7000,
    staminaCost: 20,
    damage: 15,
  },
  shield_wall: {
    id: "shield_wall",
    cdMs: 12000,
    staminaCost: 25,
    durationMs: 2500,
    damageTakenFactor: 0.35,
  },
  rapid_fire: {
    id: "rapid_fire",
    cdMs: 7000,
    staminaCost: 15,
    damage: 8,
    shots: 3,
  },
  slow_shot: {
    id: "slow_shot",
    cdMs: 10000,
    staminaCost: 18,
    damage: 6,
    slowFactor: 0.4,
    durationMs: 2500,
  },
  fireball: {
    id: "fireball",
    cdMs: 8000,
    manaCost: 30,
    damage: 22,
    aoeRadius: 48,
  },
  blink: {
    id: "blink",
    cdMs: 14000,
    manaCost: 20,
    blinkDistance: 80,
  },
};

export const CLASS_SKILLS: Record<string, SkillId[]> = {
  melee: ["dash", "shield_wall"],
  ranged: ["rapid_fire", "slow_shot"],
  mage: ["fireball", "blink"],
};

/** Default enemy XP values */
export function defaultEnemyXp(enemyType: string): number {
  switch (enemyType) {
    case "bruiser":
      return 25;
    case "runner":
      return 15;
    case "spitter":
      return 20;
    default:
      return 10;
  }
}