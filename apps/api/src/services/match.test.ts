import { beforeEach, describe, expect, it } from "vitest";
import { createHero } from "./heroes.js";
import { enemyXpPerKill, startMatch, submitMatchResult } from "./match.js";
import { memHeroes } from "./memoryStore.js";

const USER = "usr_matchtest";

beforeEach(() => {
  memHeroes.clear();
});

describe("startMatch", () => {
  it("liefert matchId + Spawn-Konfiguration", () => {
    const match = startMatch(USER);
    expect(match.matchId).toMatch(/^match_/);
    expect(match.config.mapId).toBe("prototype_map_01");
    expect(match.config.playerSpawn).toEqual({ x: 100, y: 100 });
  });
});

describe("enemyXpPerKill", () => {
  it("liest XP aus game-config.json (bruiser → 15)", () => {
    expect(enemyXpPerKill()).toBe(15);
  });
});

describe("submitMatchResult", () => {
  it("vergibt XP pro Kill und persitiert Level/Xp", async () => {
    await createHero(USER, { heroName: "Kleebart", class: "melee" });

    const res = await submitMatchResult(USER, {
      matchId: "match_test1",
      enemiesKilled: 4, // 4 × 15 = 60 XP → genau Level 2
      chestsOpened: 0,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.result.xpGained).toBe(60);
    expect(res.result.newLevel).toBe(2);
    expect(res.result.xp).toBe(0);
    expect(res.result.leveledUp).toBe(true);

    const hero = memHeroes.get(USER);
    expect(hero?.level).toBe(2);
    expect(hero?.xp).toBe(0);
  });

  it("liefert 404 ohne Held", async () => {
    const res = await submitMatchResult("usr_nobody", {
      matchId: "match_test2",
      enemiesKilled: 1,
      chestsOpened: 0,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.status).toBe(404);
  });

  it("lehnt negative Kills ab", async () => {
    await createHero(USER, { heroName: "Kleebart", class: "melee" });
    const res = await submitMatchResult(USER, {
      matchId: "match_test3",
      enemiesKilled: -1,
      chestsOpened: 0,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.status).toBe(400);
  });
});
