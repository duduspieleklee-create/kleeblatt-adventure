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

/** Eintrag einer Loot-Tabelle (game-config.json → lootTables). */
export interface LootEntry {
  templateId: string;
  name: string;
  slot: string;
  rarity: string;
  weight: number;
  allowedClasses?: string[];
  stats: Record<string, number>;
  mintCandidate?: boolean;
}

/** Weighted-Loot-Tabelle je Kiste (docs/architecture/24-api-contract.md §2.9). */
export interface LootTable {
  chestId: string;
  rolls: number;
  respawnRule: string;
  entries: LootEntry[];
}

export interface GameConfig {
  starterGear: Record<string, StarterGearItem[]>;
  itemStateEnum: string[];
  rarityEnum: string[];
  hero: {
    classes: Record<string, { label: string; description: string }>;
  };
  enemies: {
    archetypes: Record<
      string,
      { id: string; label: string; stats: { xp: number; maxHp: number; damage: number } }
    >;
    spawnConfig: { prototype: { type: string; count: number; respawnMs: number } };
  };
  xpCurve: {
    levels: Array<{ level: number; xpToNext: number | null; totalXp: number }>;
    rules: { xpOnEnemyDeath: boolean; xpKeptOnDeath: boolean; levelUpHealToFull: boolean };
  };
  match: {
    mapId: string;
    mapSize: { width: number; height: number; tileSize: number };
    playerSpawn: { x: number; y: number };
  };
  lootTables: Record<string, LootTable>;
}

let cached: GameConfig | null = null;

export function loadGameConfig(): GameConfig {
  if (cached) return cached;
  const raw = readFileSync(configPath, "utf8");
  cached = JSON.parse(raw) as GameConfig;
  return cached;
}
