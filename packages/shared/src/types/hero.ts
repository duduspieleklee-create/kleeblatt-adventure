/** Hero-related shared types (MVP classes from game-config.json) */

export type HeroClass = "mage" | "ranged" | "melee";

export const HERO_CLASSES: readonly HeroClass[] = ["mage", "ranged", "melee"] as const;

export interface Hero {
  heroName: string;
  class: HeroClass;
  level: number;
  xp: number;
}
