/** Wallet-Routen: GET /wallet (Mock-Wallet, P3). */

import { Hono } from "hono";
import type { WalletResponse } from "@kleeblatt/shared";
import { requireAuth, type AppVariables } from "../middleware/session.js";
import { getOrCreateWallet } from "../services/wallets.js";

export const walletRoutes = new Hono<{ Variables: AppVariables }>();

walletRoutes.get("/wallet", requireAuth, async (c) => {
  const user = c.get("user")!;
  const wallet = await getOrCreateWallet(user.userId);
  const body: WalletResponse = {
    address: wallet.address,
    status: wallet.status,
    provider: wallet.provider,
  };
  return c.json(body);
});
