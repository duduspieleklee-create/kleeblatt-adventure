/** Lädt game-config.json (Quelle aller Gameplay-Werte). */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** Candidate paths: monorepo root from dist/lib or src/lib, cwd, explicit env. */
function resolveConfigPath(): string {
  const candidates = [
    process.env.GAME_CONFIG_PATH,
    // apps/api/dist/lib → ../../../../game-config.json (repo root)
    resolve(here, "../../../../game-config.json"),
    // apps/api/dist/lib → ../../../game-config.json (apps/)
    resolve(here, "../../../game-config.json"),
    // next to package: apps/api/game-config.json
    resolve(here, "../../game-config.json"),
    // cwd (systemd WorkingDirectory often API root)
    resolve(process.cwd(), "game-config.json"),
    resolve(process.cwd(), "apps/api/game-config.json"),
  ].filter((p): p is string => Boolean(p));

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0] ?? resolve(here, "../../../../game-config.json");
}

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

const EMPTY_CONFIG: GameConfig = {
  starterGear: {},
  itemStateEnum: [],
  rarityEnum: [],
  hero: { classes: {} },
  enemies: { archetypes: {}, spawnConfig: { prototype: { type: "skeleton", count: 1, respawnMs: 5000 } } },
  xpCurve: { levels: [], rules: { xpOnEnemyDeath: true, xpKeptOnDeath: true, levelUpHealToFull: true } },
  match: { mapId: "proto", mapSize: { width: 2000, height: 2000, tileSize: 32 }, playerSpawn: { x: 1000, y: 1000 } },
  lootTables: {},
};

let cached: GameConfig | null = null;

export function loadGameConfig(): GameConfig {
  if (cached) return cached;
  const configPath = resolveConfigPath();
  try {
    const raw = readFileSync(configPath, "utf8");
    cached = JSON.parse(raw) as GameConfig;
    return cached;
  } catch (err) {
    console.error(`[gameConfig] failed to load ${configPath}:`, err);
    // Do not crash hero creation / match if file missing on server
    cached = EMPTY_CONFIG;
    return cached;
  }
}
