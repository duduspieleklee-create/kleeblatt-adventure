/** Wallet-Service-Tests: stabile, idempotente Mock-Adresse pro User. */

import { describe, expect, it } from "vitest";
import { mockAddressFor } from "../services/wallets.js";

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
