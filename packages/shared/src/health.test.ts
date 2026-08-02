import { describe, it, expect } from "vitest";
import {
  HERO_CLASSES,
  type HealthResponse,
  type HeroClass,
  type ItemState,
} from "./index.js";

describe("shared types smoke", () => {
  it("accepts a valid HealthResponse shape", () => {
    const body: HealthResponse = { status: "ok", service: "api" };
    expect(body.status).toBe("ok");
  });

  it("hero class union covers MVP classes", () => {
    const classes: HeroClass[] = [...HERO_CLASSES];
    expect(classes).toEqual(["mage", "ranged", "melee"]);
  });

  it("item states include web2 and secured", () => {
    const states: ItemState[] = ["web2", "secured"];
    expect(states).toContain("web2");
  });
});
