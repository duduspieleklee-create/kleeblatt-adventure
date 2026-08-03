import { beforeEach, describe, expect, it } from "vitest";
import type { InventoryItem } from "@kleeblatt/shared";
import { createHero, getHero, validateHeroName } from "./heroes.js";
import { equipItem, listItems, unequipItem } from "./items.js";
import { memHeroes, memItems } from "./memoryStore.js";

const USER = "usr_testuser";

beforeEach(() => {
  memHeroes.clear();
  memItems.clear();
});

describe("validateHeroName", () => {
  it("akzeptiert gültige Namen (2–20 Zeichen)", () => {
    expect(validateHeroName("Kleebart")).toBeNull();
    expect(validateHeroName("Kl 7")).toBeNull();
  });

  it("lehnt zu kurze Namen ab", () => {
    expect(validateHeroName("A")).not.toBeNull();
    expect(validateHeroName("")).not.toBeNull();
  });

  it("lehnt Sonderzeichen ab", () => {
    expect(validateHeroName("Klee!bart")).not.toBeNull();
    expect(validateHeroName("Klee_bart")).not.toBeNull();
  });

  it("lehnt zu lange Namen ab", () => {
    expect(validateHeroName("K".repeat(21))).not.toBeNull();
  });
});

describe("createHero", () => {
  it("legt Held mit Level 1 und 0 XP an", async () => {
    const result = await createHero(USER, { heroName: "Kleebart", class: "melee" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hero).toMatchObject({
      userId: USER,
      heroName: "Kleebart",
      class: "melee",
      level: 1,
      xp: 0,
    });
    expect(result.hero.equipped).toEqual({});
  });

  it("vergibt Starter-Gear aus game-config.json (Waffe + Rüstung, state web2)", async () => {
    const result = await createHero(USER, { heroName: "Kleebart", class: "melee" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.starterItems).toHaveLength(2);
    const slots = result.starterItems.map((i) => i.slot).sort();
    expect(slots).toEqual(["chest", "weapon"]);
    for (const item of result.starterItems) {
      expect(item.state).toBe("web2");
      expect(item.equipped).toBe(false);
    }
  });

  it("liefert 409, wenn bereits ein Held existiert", async () => {
    await createHero(USER, { heroName: "Erster", class: "mage" });
    const result = await createHero(USER, { heroName: "Zweiter", class: "melee" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });

  it("liefert 400 bei ungültiger Klasse", async () => {
    const result = await createHero(USER, { heroName: "Test", class: "invalid" as never });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("getHero liefert null ohne Held", async () => {
    expect(await getHero("usr_anderer")).toBeNull();
  });
});

describe("equip/unequip", () => {
  async function setup() {
    const result = await createHero(USER, { heroName: "Kleebart", class: "melee" });
    if (!result.ok) throw new Error("setup failed");
    return result;
  }

  it("legt Starter-Waffe an und setzt hero.equipped.weapon", async () => {
    const { hero, starterItems } = await setup();
    const weapon = starterItems.find((i) => i.slot === "weapon")!;
    const result = await equipItem(USER, weapon.itemId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hero.equipped.weapon).toBe(weapon.itemId);
    expect(result.inventory.find((i) => i.itemId === weapon.itemId)?.equipped).toBe(true);
    expect(hero.equipped.weapon).toBe(weapon.itemId);
  });

  it("legt Rüstung im selben Slot ab, wenn neue angelegt wird", async () => {
    const { starterItems } = await setup();
    const chest = starterItems.find((i) => i.slot === "chest")!;
    await equipItem(USER, chest.itemId);
    // zweite chest-Rüstung simulieren (frisch, nicht angelegt)
    const second = { ...chest, itemId: "item_zweite_rüstung", equipped: false };
    memItems.set(second.itemId, { ownerId: USER, item: second });
    const result = await equipItem(USER, second.itemId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hero.equipped.chest).toBe(second.itemId);
    expect(result.inventory.find((i) => i.itemId === chest.itemId)?.equipped).toBe(false);
  });

  it("lehnt Items mit falscher Klasse ab", async () => {
    const { starterItems } = await setup();
    const base = starterItems[0]!;
    const mageItem: InventoryItem = {
      ...base,
      itemId: "item_mage_stab",
      allowedClasses: ["mage"],
    };
    memItems.set(mageItem.itemId, { ownerId: USER, item: mageItem });
    const result = await equipItem(USER, mageItem.itemId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("findet fremde Items nicht (404)", async () => {
    await setup();
    const foreign = await createHero("usr_fremd", { heroName: "Fremder", class: "ranged" });
    if (!foreign.ok) throw new Error("setup failed");
    const foreignItem = foreign.starterItems[0]!;
    const result = await equipItem(USER, foreignItem.itemId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("legt Items wieder ab", async () => {
    const { starterItems } = await setup();
    const weapon = starterItems.find((i) => i.slot === "weapon")!;
    await equipItem(USER, weapon.itemId);
    const result = await unequipItem(USER, weapon.itemId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hero.equipped.weapon).toBeUndefined();
    expect(result.inventory.find((i) => i.itemId === weapon.itemId)?.equipped).toBe(false);
  });

  it("listItems liefert nur eigene Items", async () => {
    await setup();
    const foreign = await createHero("usr_fremd", { heroName: "Fremder", class: "ranged" });
    if (!foreign.ok) throw new Error("setup failed");
    const items = await listItems(USER);
    expect(items).toHaveLength(2);
    expect(items.every((i) => i.name.includes("Starter"))).toBe(true);
  });
});
