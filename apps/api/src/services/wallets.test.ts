/** Wallet-Service-Tests: stabile, idempotente Mock-Adresse pro User. */

import { describe, expect, it } from "vitest";
import { mockAddressFor, getMockBalance } from "../services/wallets.js";

// deterministische Helper-Funktion direkt testen (DB-unabhängig)
describe("mockAddressFor", () => {
  it("erzeugt eine gültige EVM-artige Adresse (0x + 40 Hex)", () => {
    const addr = mockAddressFor("usr_test123");
    expect(addr).toMatch(/^0x[0-9a-f]{40}$/);
  });

  it("ist deterministisch (gleiche User-ID → gleiche Adresse)", () => {
    expect(mockAddressFor("usr_abc")).toBe(mockAddressFor("usr_abc"));
  });

  it("liefert unterschiedliche Adressen für unterschiedliche User", () => {
    expect(mockAddressFor("usr_a")).not.toBe(mockAddressFor("usr_b"));
  });
});

// Token-Balance-Werte prüfen (Issue #128): deterministisch, plausibler Wertebereich.
describe("getMockBalance", () => {
  const addr = "0x1234567890abcdef1234567890abcdef12345678";

  it("ist deterministisch (gleiche Adresse → gleiche Balance)", () => {
    expect(getMockBalance(addr)).toEqual(getMockBalance(addr));
  });

  it("liefert formatierte ETH/IMX-Strings in plausiblem Bereich", () => {
    const b = getMockBalance(addr);
    expect(b.eth).toMatch(/^\d+\.\d{4}$/);
    expect(b.imx).toMatch(/^\d+\.\d{2}$/);
    expect(Number(b.eth)).toBeGreaterThanOrEqual(0);
    expect(Number(b.eth)).toBeLessThan(5);
    expect(Number(b.imx)).toBeGreaterThanOrEqual(0);
    expect(Number(b.imx)).toBeLessThan(2500);
  });

  it("liefert unterschiedliche Balances für unterschiedliche Adressen", () => {
    expect(getMockBalance("0x" + "a".repeat(40))).not.toEqual(getMockBalance("0x" + "b".repeat(40)));
  });
});
