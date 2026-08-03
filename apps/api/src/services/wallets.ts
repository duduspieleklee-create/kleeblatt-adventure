/** Wallet-Service: stabile Mock-Adresse pro User (Postgres, sonst In-Memory-Fallback). */

import { eq } from "drizzle-orm";
import { getDb, isDbAvailable } from "../db/client.js";
import { wallets as walletsTable, type WalletRow } from "../db/schema.js";
import { memWallets } from "./memoryStore.js";

/**
 * Deterministische Mock-Adresse aus userId. Für den Prototyp stabil und eindeutig,
 * ohne externen Provider. Format: 0x + 40 Hex-Zeichen (wie eine EVM-Adresse).
 */
export function mockAddressFor(userId: string): string {
  const seed = userId.split("").reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 2166136261);
  let hex = seed.toString(16).padStart(8, "0");
  // mehrmals hashen, um auf 40 Zeichen zu kommen (deterministisch)
  for (let i = 0; i < 5; i++) {
    let h = 2166136261;
    for (const ch of hex) h = ((h ^ ch.charCodeAt(0)) * 16777619) >>> 0;
    hex += h.toString(16).padStart(8, "0");
  }
  return `0x${hex.slice(0, 40)}`;
}

export interface WalletView {
  address: string;
  status: "pending" | "ready";
  provider: string;
}

export async function getOrCreateWallet(userId: string): Promise<WalletView> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    let row = (await db.select().from(walletsTable).where(eq(walletsTable.userId, userId)).limit(1))[0];
    if (!row) {
      row = {
        userId,
        address: mockAddressFor(userId),
        providerRef: null,
        status: "ready",
        createdAt: new Date(),
      } satisfies WalletRow;
      await db.insert(walletsTable).values(row).onConflictDoNothing();
    }
    return { address: row.address, status: row.status, provider: "mock" };
  }

  // In-Memory-Fallback
  let mem = memWallets.get(userId);
  if (!mem) {
    mem = { address: mockAddressFor(userId), status: "ready", provider: "mock" };
    memWallets.set(userId, mem);
  }
  return mem;
}
