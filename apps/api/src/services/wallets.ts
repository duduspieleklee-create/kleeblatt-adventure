/** Wallet-Service: Mock-Wallet + Immutable-style connect flow (P9). */

import { eq } from "drizzle-orm";
import { getDb, isDbAvailable } from "../db/client.js";
import { wallets as walletsTable, type WalletRow } from "../db/schema.js";
import { memWallets } from "./memoryStore.js";
import type { WalletConnectRequest, WalletConnectResponse } from "@kleeblatt/shared";

export function mockAddressFor(userId: string): string {
  const seed = userId
    .split("")
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 2166136261);
  let hex = seed.toString(16).padStart(8, "0");
  for (let i = 0; i < 5; i++) {
    let h = 2166136261;
    for (const ch of hex) h = ((h ^ ch.charCodeAt(0)) * 16777619) >>> 0;
    hex += h.toString(16).padStart(8, "0");
  }
  return `0x${hex.slice(0, 40)}`;
}

export function mockDepositAddress(address: string): string {
  return `0x${address.slice(2).split("").reverse().join("").slice(0, 40)}`;
}

/** Deterministic mock balance from address (for prototype display). */
function mockBalance(address: string): { eth: string; imx: string } {
  const seed = address
    .split("")
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 2166136261);
  const eth = ((seed % 50000) / 10000).toFixed(4);
  const imx = ((seed % 250000) / 100).toFixed(2);
  return { eth, imx };
}

export function getMockBalance(address: string): { eth: string; imx: string } {
  return mockBalance(address);
}

export interface WalletView {
  address: string;
  status: "pending" | "ready" | "disconnected";
  provider: string;
  depositAddress?: string;
  chainId?: number;
}

export async function getWallet(userId: string): Promise<WalletView | null> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    const rows = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId)).limit(1);
  if (rows.length === 0) return null;
  const row = rows[0]!;
  return {
    address: row.address,
    status: row.status as WalletView["status"],
    provider: row.providerRef ?? "mock",
    depositAddress: row.providerRef ? mockDepositAddress(row.address) : undefined,
    chainId: 13371,
  };

  }

  const mem = memWallets.get(userId);
  if (!mem) return null;
  return {
    address: mem.address,
    status: mem.status,
    provider: mem.provider,
    depositAddress: mem.provider !== "none" ? mockDepositAddress(mem.address) : undefined,
    chainId: 13371,
  };
}

export async function getOrCreateWallet(userId: string): Promise<WalletView> {
  const existing = await getWallet(userId);
  if (existing) return existing;

  const address = mockAddressFor(userId);
  const view: WalletView = {
    address,
    status: "ready",
    provider: "mock",
    depositAddress: mockDepositAddress(address),
    chainId: 13371,
  };

  if (await isDbAvailable()) {
    const db = getDb()!;
    await db.insert(walletsTable).values({
      userId,
      address,
      providerRef: "mock",
      status: "ready",
      createdAt: new Date(),
    }).onConflictDoNothing();
  } else {
    memWallets.set(userId, { address, status: "ready", provider: "mock" });
  }

  return view;
}

export async function connectWallet(
  userId: string,
  _input: WalletConnectRequest,
): Promise<WalletConnectResponse> {
  const address = _input.address || mockAddressFor(userId);
  const isNew = !(await getWallet(userId));

  if (await isDbAvailable()) {
    const db = getDb()!;
    await db.insert(walletsTable).values({
      userId,
      address,
      providerRef: _input.provider,
      status: "ready",
      createdAt: new Date(),
    }).onConflictDoNothing();
  } else {
    memWallets.set(userId, { address, status: "ready", provider: _input.provider });
  }

  return {
    address,
    status: "ready",
    provider: _input.provider,
    depositAddress: mockDepositAddress(address),
    isNewUser: isNew,
  };
}

export async function disconnectWallet(userId: string): Promise<WalletView | null> {
  if (await isDbAvailable()) {
    const db = getDb()!;
    await db.update(walletsTable).set({ status: "disconnected", providerRef: null }).where(eq(walletsTable.userId, userId));
  } else {
    const mem = memWallets.get(userId);
    if (mem) {
      mem.status = "disconnected";
      mem.provider = "none";
    }
  }
  const wallet = await getWallet(userId);
  return wallet ?? { address: "", status: "disconnected", provider: "none" };
}

export async function getDepositAddress(userId: string): Promise<string> {
  const wallet = await getOrCreateWallet(userId);
  return wallet.depositAddress ?? wallet.address;
}
