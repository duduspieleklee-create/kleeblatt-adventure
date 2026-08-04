import { beforeEach, describe, expect, it } from "vitest";
import { loadGameConfig, type LootEntry } from "../lib/gameConfig.js";
import { listChests, openChest, rollLootEntry } from "./chests.js";
import { memChestOpens, memItems } from "./memoryStore.js";

const USER = "usr_chesttest";

beforeEach(() => {
  memItems.clear();
  memChestOpens.clear();
});

describe("rollLootEntry", () => {
  it("liefert immer einen gültigen Eintrag aus der Konfiguration", () => {
    const table = loadGameConfig().lootTables.prototype_chest;
    expect(table).toBeDefined();
    if (!table) return;
    for (let i = 0; i < 50; i++) {
      const entry = rollLootEntry(table.entries);
      expect(table.entries).toContain(entry);
    }
  });

  it("bevorzugt Einträge mit höherem Gewicht (statistisch)", () => {
    const entries: LootEntry[] = [
      { templateId: "a", name: "A", slot: "chest", rarity: "common", weight: 90, stats: {} },
      { templateId: "b", name: "B", slot: "weapon", rarity: "epic", weight: 10, stats: {} },
    ];
    const picks = new Map<string, number>();
    for (let i = 0; i < 1000; i++) {
      const e = rollLootEntry(entries);
      picks.set(e.templateId, (picks.get(e.templateId) ?? 0) + 1);
    }
    expect(picks.get("a") ?? 0).toBeGreaterThan(picks.get("b") ?? 0);
  });
});

describe("listChests", () => {
  it("liefert Kisten aus game-config.json mit opened=false", async () => {
    const chests = await listChests(USER);
    expect(chests.length).toBeGreaterThan(0);
    expect(chests[0]).toMatchObject({
      chestId: expect.any(String),
      x: expect.any(Number),
      y: expect.any(Number),
      opened: false,
    });
  });

  it("markiert geöffnete Kisten als opened", async () => {
    memChestOpens.set(`${USER}:prototype_chest`, new Date().toISOString());
    const chests = await listChests(USER);
    const opened = chests.find((c) => c.chestId === "prototype_chest");
    expect(opened?.opened).toBe(true);
  });
});

describe("openChest", () => {
  it("legt Item an (State web2) und markiert Kiste als geöffnet", async () => {
    const res = await openChest(USER, "prototype_chest");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.item.templateId).toMatch(/^loot_/);
    expect(res.item.state).toBe("web2");
    expect(memItems.has(res.item.itemId)).toBe(true);
    expect(memChestOpens.has(`${USER}:prototype_chest`)).toBe(true);
  });

  it("liefert 409 bei zweitem Öffnen (einmalig pro Spieler)", async () => {
    const first = await openChest(USER, "prototype_chest");
    expect(first.ok).toBe(true);

    const second = await openChest(USER, "prototype_chest");
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.status).toBe(409);
      expect(second.error).toMatch(/bereits geöffnet/);
    }
  });

  it("liefert 404 für unbekannte Kiste", async () => {
    const res = await openChest(USER, "chest_does_not_exist");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(404);
  });
});
