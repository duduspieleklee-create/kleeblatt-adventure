/** Lädt game-config.json aus dem Repo-Root (Quelle aller Gameplay-Werte). */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// src/lib (oder dist/lib) → Repo-Root
const rootDir = resolve(here, "../../../../");
const configPath = resolve(rootDir, "game-config.json");

export interface StarterGearItem {
  templateId: string;
  name: string;
  slot: string;
  rarity: string;
  state: string;
  allowedClasses: string[];
  stats: Record<string, number>;
  description: string;
}

export interface GameConfig {
  starterGear: Record<string, StarterGearItem[]>;
  itemStateEnum: string[];
  rarityEnum: string[];
  hero: {
    classes: Record<string, { label: string; description: string }>;
  };
}

let cached: GameConfig | null = null;

export function loadGameConfig(): GameConfig {
  if (cached) return cached;
  const raw = readFileSync(configPath, "utf8");
  cached = JSON.parse(raw) as GameConfig;
  return cached;
}
