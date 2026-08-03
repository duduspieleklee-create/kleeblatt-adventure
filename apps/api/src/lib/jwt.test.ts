import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "./jwt.js";

describe("jwt session", () => {
  it("round-trips a session user", async () => {
    const user = {
      userId: "usr_test",
      email: "t@example.com",
      displayName: "Tester",
      picture: null,
    };
    const token = await signSession(user);
    const back = await verifySession(token);
    expect(back).toEqual(user);
  });

  it("rejects garbage", async () => {
    expect(await verifySession("not-a-jwt")).toBeNull();
  });
});
