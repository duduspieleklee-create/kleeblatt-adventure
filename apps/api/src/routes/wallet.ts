/** Wallet-Routen: GET /wallet, POST /wallet/connect, POST /wallet/disconnect, GET /wallet/balance, POST /wallet/auth (P9). */

import { Hono } from "hono";
import { ethers } from "ethers";
import type { WalletBalance, WalletConnectRequest, WalletConnectResponse, WalletResponse } from "@kleeblatt/shared";
import { requireAuth, type AppVariables } from "../middleware/session.js";
import { connectWallet, disconnectWallet, getDepositAddress, getMockBalance, getWallet, toWalletResponse } from "../services/wallets.js";
import { signSession } from "../lib/jwt.js";
import { upsertGoogleUser } from "../services/users.js";
import { getOrCreateWallet } from "../services/wallets.js";
import { setCookie } from "hono/cookie";
import { SESSION_COOKIE_NAME } from "@kleeblatt/shared";
import { env, sessionCookie } from "../config/env.js";
import { getFaucet, canClaimWelcome, getStakingInfo } from "../lib/chain.js";

export const walletRoutes = new Hono<{ Variables: AppVariables }>();

walletRoutes.get("/wallet", requireAuth, async (c) => {
  const user = c.get("user")!;
  const wallet = await getWallet(user.userId);
  if (!wallet) {
    return c.json({ address: "", status: "disconnected", provider: "none" } satisfies WalletResponse);
  }
  return c.json(toWalletResponse(wallet));
});

walletRoutes.post("/wallet/connect", requireAuth, async (c) => {
  const user = c.get("user")!;
  if (user.guest) {
    return c.json(
      { error: { code: "GUEST_FORBIDDEN", message: "Guests cannot connect a wallet. Upgrade to a full account first.", retryable: false } },
      403,
    );
  }
  const input = (await c.req.json()) as WalletConnectRequest;
  const result = await connectWallet(user.userId, input);
  return c.json(result satisfies WalletConnectResponse);
});

walletRoutes.post("/wallet/disconnect", requireAuth, async (c) => {
  const user = c.get("user")!;
  const wallet = await disconnectWallet(user.userId);
  if (!wallet) {
    return c.json({ address: "", status: "disconnected", provider: "none" } satisfies WalletResponse);
  }
  return c.json(toWalletResponse(wallet));
});

walletRoutes.get("/wallet/deposit-address", requireAuth, async (c) => {
  const user = c.get("user")!;
  const deposit = await getDepositAddress(user.userId);
  return c.json({ depositAddress: deposit });
});

/** GET /wallet/balance – mock ETH + IMX balance (null when no wallet linked) */
walletRoutes.get("/wallet/balance", requireAuth, async (c) => {
  const user = c.get("user")!;
  const wallet = await getWallet(user.userId);
  if (!wallet || !wallet.address) {
    return c.json({ address: "", connected: false, ethBalance: null, imxBalance: null } satisfies WalletBalance);
  }
  const balance = getMockBalance(wallet.address);
  const body: WalletBalance = {
    address: wallet.address,
    connected: true,
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

/**
 * POST /wallet/welcome-claim
 *
 * Flow:
 *  1. Client prompts MetaMask to sign a deterministic message (ownership proof).
 *  2. Client sends { signature, message } to this endpoint.
 *  3. Server recovers the signer address from the signature and checks it matches
 *     the wallet linked to the authenticated session.
 *  4. Server calls claimFor on-chain (pays gas). Contract enforces once-only.
 *
 * Requires: authenticated session + wallet linked + valid ownership signature.
 */
walletRoutes.post("/wallet/welcome-claim", requireAuth, async (c) => {
  const user = c.get("user")!;

  // 1. Parse body
  const body = await c.req.json().catch(() => null) as { signature?: string; message?: string } | null;
  if (!body?.signature || !body?.message) {
    return c.json({ ok: false, reason: "missing_signature" }, 400);
  }

  // 2. Resolve the wallet address linked to this session
  const wallet = await getWallet(user.userId);
  if (!wallet?.address) {
    return c.json({ ok: false, reason: "no_wallet" }, 400);
  }
  const linkedAddress = wallet.address.toLowerCase();

  // 3. Recover signer from signature and verify it matches the linked wallet
  let recovered: string;
  try {
    recovered = ethers.verifyMessage(body.message, body.signature).toLowerCase();
  } catch {
    return c.json({ ok: false, reason: "invalid_signature" }, 400);
  }
  if (recovered !== linkedAddress) {
    return c.json({ ok: false, reason: "address_mismatch" }, 403);
  }

  // 4. Check eligibility on-chain (fast read — avoids wasting a tx)
  const eligible = await canClaimWelcome(wallet.address);
  if (!eligible) {
    return c.json({ ok: false, reason: "already_claimed" }, 400);
  }

  // 5. Server calls claimFor (pays gas)
  const faucet = getFaucet();
  if (!faucet) {
    return c.json({ ok: false, reason: "not_configured" }, 503);
  }

  try {
    const tx = await faucet.claimFor(wallet.address);
    await tx.wait();
    return c.json({ ok: true, txHash: tx.hash });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Already claimed")) {
      return c.json({ ok: false, reason: "already_claimed" }, 400);
    }
    console.error("[welcome-claim] on-chain error:", message);
    return c.json({ ok: false, reason: "chain_error" }, 500);
  }
});

/**
 * GET /wallet/staking-info
 *
 * Returns the staking position for the authenticated user's linked wallet:
 * stakedBalance, pendingRewards, totalStaked, kltBalance.
 *
 * Requires: wallet-authenticated session + wallet linked.
 * Guests and users without a linked wallet receive 403 / 400 respectively.
 */
walletRoutes.get("/wallet/staking-info", requireAuth, async (c) => {
  const user = c.get("user")!;
  if (user.guest) {
    return c.json({ error: { code: "GUEST_FORBIDDEN", message: "Guests cannot access staking.", retryable: false } }, 403);
  }
  const wallet = await getWallet(user.userId);
  if (!wallet?.address) {
    return c.json({ error: { code: "NO_WALLET", message: "No wallet linked to this account.", retryable: false } }, 400);
  }
  const info = await getStakingInfo(wallet.address);
  if (!info) {
    return c.json({ error: { code: "NOT_CONFIGURED", message: "Staking contract not configured.", retryable: false } }, 503);
  }
  return c.json(info);
});
