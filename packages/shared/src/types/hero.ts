/** Hero-related shared types (MVP classes from game-config.json) */

import type { InventoryItem } from "./item.js";

export type HeroClass = "mage" | "ranged" | "melee";

export const HERO_CLASSES: readonly HeroClass[] = ["mage", "ranged", "melee"] as const;

/** Class metadata for the hero setup UI (labels match game-config.json → hero.classes). */
export interface HeroClassInfo {
  id: HeroClass;
  label: string;
  description: string;
}

export const HERO_CLASS_OPTIONS: readonly HeroClassInfo[] = [
  { id: "melee", label: "Nahkämpfer", description: "Frontline, Dash, Schildwall" },
  { id: "ranged", label: "Fernkämpfer", description: "Distanz, Kiting, Slow" },
  { id: "mage", label: "Magier", description: "Distanzzauber, Burst, Blink" },
] as const;

export function isHeroClass(value: string): value is HeroClass {
  return (HERO_CLASSES as readonly string[]).includes(value);
}

export interface Hero {
  userId: string;
  heroName: string;
  class: HeroClass;
  level: number;
  xp: number;
  /** slot → itemId (gegenstände, die aktuell angelegt sind) */
  equipped: Record<string, string>;
}

export interface CreateHeroInput {
  heroName: string;
  class: HeroClass;
}

/** Response von POST /hero (201) – Held inkl. Starter-Items */
export interface HeroResponse extends Hero {
  starterItems: InventoryItem[];
}
