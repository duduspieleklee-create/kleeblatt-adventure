/**
 * Match-Service: Match starten + Ergebnis verrechnen (XP + Level-Up).
 *
 * Server-authoritativ (docs/architecture/24-api-contract.md §2.8):
 * XP = enemiesKilled * enemyXp (aus game-config.json → enemies.archetypes).
 * Level-Up über die XP-Kurve (game-config.json → xpCurve).
 */

import type { Hero } from "@kleeblatt/shared";
import { applyXp } from "@kleeblatt/shared";
import { eq } from "drizzle-orm";
import { getDb, isDbAvailable } from "../db/client.js";
import { heroes as heroesTable } from "../db/schema.js";
import { loadGameConfig } from "../lib/gameConfig.js";
import { newId } from "../lib/ids.js";
import { getHero } from "./heroes.js";
import { memHeroes } from "./memoryStore.js";

export interface MatchStartResult {
  matchId: string;
  startedAt: string;
  config: { mapId: string; playerSpawn: { x: number; y: number } };
}

export interface MatchResultInput {
  matchId: string;
  enemiesKilled: number;
  chestsOpened: number;
}

export interface MatchResultResponse {
  matchId: string;
  xpGained: number;
  newLevel: number;
  xp: number;
  xpToNext: number | null;
  leveledUp: boolean;
  hero: Hero;
}

/** XP je getötetem Enemy aus game-config.json (Prototyp: bruiser). */
export function enemyXpPerKill(): number {
  const config = loadGameConfig();
  const type = config.enemies.spawnConfig.prototype.type;
  const archetype = config.enemies.archetypes[type];
  return archetype?.stats.xp ?? 10;
}

export function startMatch(_userId: string): MatchStartResult {
  const config = loadGameConfig();
  return {
    matchId: newId("match"),
    startedAt: new Date().toISOString(),
    config: {
      mapId: config.match.mapId,
      playerSpawn: config.match.playerSpawn,
    },
  };
}

export type SubmitMatchResult =
  { ok: true; result: MatchResultResponse } | { ok: false; status: 400 | 404; error: string };

export async function submitMatchResult(
  userId: string,
  input: MatchResultInput,
): Promise<SubmitMatchResult> {
  const hero = await getHero(userId);
  if (!hero) return { ok: false, status: 404, error: "Kein Held vorhanden." };
  if (input.enemiesKilled < 0 || input.chestsOpened < 0) {
    return { ok: false, status: 400, error: "Ungültige Werte (negativ)." };
  }

  const config = loadGameConfig();
  const rules = config.xpCurve.rules;

  let xpGained = 0;
  if (rules.xpOnEnemyDeath) {
    xpGained += input.enemiesKilled * enemyXpPerKill();
  }

  // XP-Kurve aus game-config.json (source of truth), nicht die Default-Kurve
  const curve = config.xpCurve.levels.map((l) => ({
    level: l.level,
    xpToNext: l.xpToNext,
    totalXp: l.totalXp,
  }));
  const next = applyXp({ level: hero.level, xp: hero.xp }, xpGained, curve);
  const leveledUp = next.leveledUp;

  // Persistieren: level + xp (und volle HP bei Level-Up → nur Level im Hero, HP ist Match-State)
  const updated: Hero = { ...hero, level: next.level, xp: next.xp };
  await persistHero(updated);

  return {
    ok: true,
    result: {
      matchId: input.matchId,
      xpGained,
      newLevel: next.level,
      xp: next.xp,
      xpToNext: next.xpToNext,
      leveledUp,
      hero: updated,
    },
  };
}

async function persistHero(hero: Hero): Promise<void> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    await db
      .update(heroesTable)
      .set({ level: hero.level, xp: hero.xp })
      .where(eq(heroesTable.userId, hero.userId));
  } else {
    memHeroes.set(hero.userId, hero);
  }
}
