/** Wallet-Routen: GET /wallet, POST /wallet/connect, POST /wallet/disconnect, GET /wallet/balance, POST /wallet/auth (P9). */

import { Hono } from "hono";
import type { WalletBalance, WalletConnectRequest, WalletConnectResponse, WalletResponse } from "@kleeblatt/shared";
import { requireAuth, type AppVariables } from "../middleware/session.js";
import { connectWallet, disconnectWallet, getDepositAddress, getMockBalance, getWallet, connectImmutableWallet, getImmutableDepositAddress } from "../services/wallets.js";
import { signSession } from "../lib/jwt.js";
import { upsertGoogleUser } from "../services/users.js";
import { getOrCreateWallet } from "../services/wallets.js";
import { setCookie } from "hono/cookie";
import { SESSION_COOKIE_NAME } from "@kleeblatt/shared";
import { env, sessionCookie } from "../config/env.js";

export const walletRoutes = new Hono<{ Variables: AppVariables }>();

walletRoutes.get("/wallet", requireAuth, async (c) => {
  const user = c.get("user")!;
  const wallet = await getWallet(user.userId);
  if (!wallet) {
    return c.json({ address: "", status: "disconnected", provider: "none" } satisfies WalletResponse);
  }
  const body: WalletResponse = {
    address: wallet.address,
    status: wallet.status,
    provider: wallet.provider,
    depositAddress: wallet.depositAddress ?? undefined,
    chainId: wallet.chainId ?? undefined,
  };
  return c.json(body);
});

walletRoutes.post("/wallet/connect", requireAuth, async (c) => {
  const user = c.get("user")!;
  const input = (await c.req.json()) as WalletConnectRequest;
  const result = await connectWallet(user.userId, input);
  return c.json(result satisfies WalletConnectResponse);
});

/**
 * POST /wallet/connect-immutable - Connect wallet using Immutable SDK
 */
walletRoutes.post("/wallet/connect-immutable", requireAuth, async (c) => {
  const user = c.get("user")!;
  const input = (await c.req.json()) as WalletConnectRequest;
  
  // If provider is 'immutable', use the Immutable SDK integration
  if (input.provider === 'immutable') {
    const result = await connectImmutableWallet(user.userId, input.address);
    return c.json(result satisfies WalletConnectResponse);
  }
  
  // Otherwise fall back to regular connect
  const result = await connectWallet(user.userId, input);
  return c.json(result satisfies WalletConnectResponse);
});

walletRoutes.post("/wallet/disconnect", requireAuth, async (c) => {
  const user = c.get("user")!;
  const wallet = await disconnectWallet(user.userId);
  if (!wallet) {
    return c.json({ address: "", status: "disconnected", provider: "none" } satisfies WalletResponse);
  }
  return c.json({
    address: wallet.address,
    status: wallet.status,
    provider: wallet.provider,
    depositAddress: wallet.depositAddress ?? undefined,
    chainId: wallet.chainId ?? undefined,
  } satisfies WalletResponse);
});

walletRoutes.get("/wallet/deposit-address", requireAuth, async (c) => {
  const user = c.get("user")!;
  const deposit = await getDepositAddress(user.userId);
  return c.json({ depositAddress: deposit });
});

/**
 * GET /wallet/deposit-address-immutable - Get deposit address using Immutable SDK
 */
walletRoutes.get("/wallet/deposit-address-immutable", requireAuth, async (c) => {
  const user = c.get("user")!;
  const deposit = await getImmutableDepositAddress(user.userId);
  return c.json({ depositAddress: deposit });
});

/** GET /wallet/balance – mock ETH + IMX balance */
walletRoutes.get("/wallet/balance", requireAuth, async (c) => {
  const user = c.get("user")!;
  const wallet = await getWallet(user.userId);
  if (!wallet || !wallet.address) {
    return c.json({ address: "", ethBalance: "0", imxBalance: "0" } satisfies WalletBalance);
  }
  const balance = getMockBalance(wallet.address);
  const body: WalletBalance = {
    address: wallet.address,
    ethBalance: balance.eth,
    imxBalance: balance.imx,
  };
  return c.json(body);
});

/**
 * POST /wallet/auth – Sign-in with wallet (mock).
 * Accepts wallet address, creates/finds user, auto-provisions wallet, returns session.
 */
walletRoutes.post("/wallet/auth", async (c) => {
  const body = (await c.req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object" || !("address" in body)) {
    return c.json({ error: { code: "VALIDATION", message: "address fehlt.", retryable: false } }, 400);
  }
  const address = (body as { address: string }).address;
  if (!address || !address.startsWith("0x") || address.length !== 42) {
    return c.json({ error: { code: "VALIDATION", message: "Ungültige Wallet-Adresse.", retryable: false } }, 400);
  }

  const user = await upsertGoogleUser({
    googleId: `wallet-${address.toLowerCase().slice(2)}`,
    email: `${address}@wallet`,
    displayName: `${address.slice(0, 6)}…${address.slice(-4)}`,
    picture: null,
  });

  await getOrCreateWallet(user.userId);

  const jwt = await signSession(user);
  const cookieOpts = {
    httpOnly: sessionCookie.httpOnly,
    path: sessionCookie.path,
    maxAge: sessionCookie.ttlSeconds,
    sameSite: sessionCookie.sameSite,
    secure: sessionCookie.secure,
  } as const;
  setCookie(c, SESSION_COOKIE_NAME, jwt, cookieOpts);
  return c.json({ ok: true, redirect: `${env.webUrl}/?auth=ok` });
});
