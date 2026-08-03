import { describe, it, expect, vi } from "vitest";
import { gameBridge, TypedEmitter, type GameBridgeEvents } from "./gameBridge.js";

describe("gameBridge (Doku 14: Phaser-React Bridge)", () => {
  it("player:hp updates HUD listeners", () => {
    const received: number[] = [];
    const onHp = ({ current }: { current: number; max: number }) => received.push(current);

    gameBridge.on("player:hp", onHp);
    gameBridge.emit("player:hp", { current: 50, max: 120 });
    gameBridge.emit("player:hp", { current: 30, max: 120 });
    gameBridge.off("player:hp", onHp);

    expect(received).toEqual([50, 30]);
  });

  it("emits all documented Phaser → React events with typed payloads", () => {
    const hp = vi.fn();
    const resource = vi.fn();
    const level = vi.fn();
    const death = vi.fn();
    const respawn = vi.fn();
    const enemyDied = vi.fn();
    const enemyDamaged = vi.fn();
    const loot = vi.fn();
    const matchStarted = vi.fn();
    const matchEnded = vi.fn();
    const cooldown = vi.fn();
    const skillUsed = vi.fn();
    const chestOpened = vi.fn();

    gameBridge.on("player:hp", hp);
    gameBridge.on("player:resource", resource);
    gameBridge.on("player:level", level);
    gameBridge.on("player:death", death);
    gameBridge.on("player:respawn", respawn);
    gameBridge.on("enemy:died", enemyDied);
    gameBridge.on("enemy:damaged", enemyDamaged);
    gameBridge.on("loot:received", loot);
    gameBridge.on("match:started", matchStarted);
    gameBridge.on("match:ended", matchEnded);
    gameBridge.on("skill:cooldown", cooldown);
    gameBridge.on("skill:used", skillUsed);
    gameBridge.on("chest:opened", chestOpened);

    gameBridge.emit("player:hp", { current: 80, max: 120 });
    gameBridge.emit("player:resource", { current: 10, max: 50, type: "mana" });
    gameBridge.emit("player:level", { level: 2, xp: 120, xpToNext: 200 });
    gameBridge.emit("player:death", {});
    gameBridge.emit("player:respawn", { hp: 120 });
    gameBridge.emit("enemy:died", { enemyId: "e1", typeId: "bruiser", xp: 25, x: 10, y: 20 });
    gameBridge.emit("enemy:damaged", { enemyId: "e1", hp: 40, maxHp: 100 });
    gameBridge.emit("loot:received", {
      itemId: "i1",
      templateId: "t1",
      name: "Schwert",
      rarity: "common",
    });
    gameBridge.emit("match:started", { matchId: "m1" });
    gameBridge.emit("match:ended", { matchId: "m1", enemiesKilled: 3, chestsOpened: 1 });
    gameBridge.emit("skill:cooldown", { skillId: "basic_attack", readyAt: 1234567890 });
    gameBridge.emit("skill:used", { skillId: "basic_attack" });
    gameBridge.emit("chest:opened", { chestId: "c1" });

    expect(hp).toHaveBeenCalledWith({ current: 80, max: 120 });
    expect(resource).toHaveBeenCalledWith({ current: 10, max: 50, type: "mana" });
    expect(level).toHaveBeenCalledWith({ level: 2, xp: 120, xpToNext: 200 });
    expect(death).toHaveBeenCalledWith({});
    expect(respawn).toHaveBeenCalledWith({ hp: 120 });
    expect(enemyDied).toHaveBeenCalledWith({
      enemyId: "e1",
      typeId: "bruiser",
      xp: 25,
      x: 10,
      y: 20,
    });
    expect(enemyDamaged).toHaveBeenCalledWith({ enemyId: "e1", hp: 40, maxHp: 100 });
    expect(loot).toHaveBeenCalledWith({
      itemId: "i1",
      templateId: "t1",
      name: "Schwert",
      rarity: "common",
    });
    expect(matchStarted).toHaveBeenCalledWith({ matchId: "m1" });
    expect(matchEnded).toHaveBeenCalledWith({ matchId: "m1", enemiesKilled: 3, chestsOpened: 1 });
    expect(cooldown).toHaveBeenCalledWith({ skillId: "basic_attack", readyAt: 1234567890 });
    expect(skillUsed).toHaveBeenCalledWith({ skillId: "basic_attack" });
    expect(chestOpened).toHaveBeenCalledWith({ chestId: "c1" });
  });

  it("emits all documented React → Phaser events with typed payloads", () => {
    const matchStart = vi.fn();
    const matchExit = vi.fn();
    const loadout = vi.fn();
    const pause = vi.fn();
    const resume = vi.fn();

    gameBridge.on("match:start", matchStart);
    gameBridge.on("match:exit", matchExit);
    gameBridge.on("loadout:update", loadout);
    gameBridge.on("pause", pause);
    gameBridge.on("resume", resume);

    gameBridge.emit("match:start", {
      heroClass: "mage",
      level: 3,
      equippedStats: { attack: 5, defense: 2 },
    });
    gameBridge.emit("match:exit", {});
    gameBridge.emit("loadout:update", { equippedStats: { attack: 7 } });
    gameBridge.emit("pause", {});
    gameBridge.emit("resume", {});

    expect(matchStart).toHaveBeenCalledWith({
      heroClass: "mage",
      level: 3,
      equippedStats: { attack: 5, defense: 2 },
    });
    expect(matchExit).toHaveBeenCalledWith({});
    expect(loadout).toHaveBeenCalledWith({ equippedStats: { attack: 7 } });
    expect(pause).toHaveBeenCalledWith({});
    expect(resume).toHaveBeenCalledWith({});
  });

  it("off() removes the listener (no further calls)", () => {
    const handler = vi.fn();
    gameBridge.on("player:level", handler);
    gameBridge.emit("player:level", { level: 1, xp: 0, xpToNext: 100 });
    gameBridge.off("player:level", handler);
    gameBridge.emit("player:level", { level: 2, xp: 100, xpToNext: 200 });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("TypedEmitter is usable standalone (dependency-free mitt replacement)", () => {
    type Events = { ping: { n: number } };
    const emitter = new TypedEmitter<Events>();
    const received: number[] = [];

    emitter.on("ping", ({ n }) => received.push(n));
    emitter.emit("ping", { n: 1 });
    emitter.emit("ping", { n: 2 });

    expect(received).toEqual([1, 2]);
  });

  it("GameBridgeEvents type is exported and shape-compatible", () => {
    const event: keyof GameBridgeEvents = "player:hp";
    expect(typeof event).toBe("string");
  });
});
