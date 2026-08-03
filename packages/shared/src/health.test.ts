import { describe, it, expect } from "vitest";
import {
  HERO_CLASSES,
  SESSION_COOKIE_NAME,
  type HealthResponse,
  type HeroClass,
  type ItemState,
  type MeResponse,
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

  it("session cookie name matches game-config", () => {
    expect(SESSION_COOKIE_NAME).toBe("kleeblatt_session");
  });

  it("MeResponse allows null hero", () => {
    const me: MeResponse = {
      userId: "usr_1",
      email: "a@b.c",
      displayName: null,
      picture: null,
      hero: null,
    };
    expect(me.hero).toBeNull();
  });
});
