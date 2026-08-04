/** Wallet-Routen: GET /wallet, POST /wallet/connect, POST /wallet/disconnect (P9). */

import { Hono } from "hono";
import type { WalletConnectRequest, WalletConnectResponse, WalletResponse } from "@kleeblatt/shared";
import { requireAuth, type AppVariables } from "../middleware/session.js";
import { connectWallet, disconnectWallet, getDepositAddress, getWallet } from "../services/wallets.js";

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
