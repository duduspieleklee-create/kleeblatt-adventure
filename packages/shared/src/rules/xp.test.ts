import { describe, it, expect } from "vitest";
import { applyXp, DEFAULT_XP_CURVE, type XpCurveLevel } from "./xp.js";

describe("applyXp", () => {
  it("sammelt XP innerhalb desselben Levels", () => {
    const result = applyXp({ level: 1, xp: 0 }, 30);
    expect(result).toEqual({ level: 1, xp: 30, xpToNext: 60, leveledUp: false });
  });

  it("levelt beim Überschreiten der Schwelle hoch", () => {
    const result = applyXp({ level: 1, xp: 30 }, 30);
    expect(result.level).toBe(2);
    expect(result.xp).toBe(0);
    expect(result.xpToNext).toBe(90);
    expect(result.leveledUp).toBe(true);
  });

  it("überspringt mehrere Level bei viel XP", () => {
    const result = applyXp({ level: 1, xp: 0 }, 160);
    expect(result.level).toBe(3);
    expect(result.xp).toBe(10);
    expect(result.xpToNext).toBe(150);
    expect(result.leveledUp).toBe(true);
  });

  it("rechnet XP-Reste beim Level-Up korrekt an", () => {
    const result = applyXp({ level: 2, xp: 80 }, 30); // total = 60 + 80 + 30 = 170
    expect(result.level).toBe(3);
    expect(result.xp).toBe(20);
  });

  it("bleibt am Max-Level (xpToNext null)", () => {
    const result = applyXp({ level: 9, xp: 1500 }, 99999);
    expect(result.level).toBe(10);
    expect(result.xpToNext).toBeNull();
    expect(result.leveledUp).toBe(true);
  });

  it("kapselt negatives/NaN-Gain auf 0", () => {
    const result = applyXp({ level: 2, xp: 10 }, -5);
    expect(result).toEqual({ level: 2, xp: 10, xpToNext: 90, leveledUp: false });
  });

  it("unterstützt eine eigene XP-Kurve", () => {
    const curve: readonly XpCurveLevel[] = [
      { level: 1, xpToNext: 10, totalXp: 0 },
      { level: 2, xpToNext: null, totalXp: 10 },
    ];
    const result = applyXp({ level: 1, xp: 5 }, 10, curve);
    expect(result.level).toBe(2);
    expect(result.xp).toBe(5);
    expect(result.xpToNext).toBeNull();
  });

  it("lässt Level oberhalb der Kurve unverändert", () => {
    const maxLevel = DEFAULT_XP_CURVE[DEFAULT_XP_CURVE.length - 1]!.level;
    const result = applyXp({ level: maxLevel + 1, xp: 7 }, 100);
    expect(result.level).toBe(maxLevel + 1);
    expect(result.xp).toBe(107);
    expect(result.leveledUp).toBe(false);
  });
});
