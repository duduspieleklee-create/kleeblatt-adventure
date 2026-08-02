import { describe, it, expect } from "vitest";
import type { HealthResponse, HeroClass, ItemState } from "./index.js";

describe("shared types smoke", () => {
  it("accepts a valid HealthResponse shape", () => {
    const body: HealthResponse = { status: "ok", service: "api" };
    expect(body.status).toBe("ok");
  });

  it("hero class union covers MVP classes", () => {
    const classes: HeroClass[] = ["mage", "ranged", "melee"];
    expect(classes).toHaveLength(3);
  });

  it("item states include web2 and secured", () => {
    const states: ItemState[] = ["web2", "secured"];
    expect(states).toContain("web2");
  });
});
