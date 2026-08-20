/** Wallet shapes (P3 – Mock-Wallet, extended for P9 Immutable-style login) */

export type WalletStatus = "pending" | "ready" | "disconnected";

export interface WalletResponse {
  address: string;
  status: WalletStatus;
  provider: string;
  depositAddress?: string;
  chainId?: number;
  /** Mock ETH balance (wei → ETH formatted) */
  ethBalance?: string;
  /** Mock IMX balance */
  imxBalance?: string;
}

export interface WalletConnectRequest {
  address: string;
  signature?: string;
  provider: "mock" | "metamask" | "walletconnect";
}

export interface WalletConnectResponse {
  address: string;
  status: WalletStatus;
  provider: string;
  depositAddress: string;
  isNewUser: boolean;
}

export interface WalletBalance {
  /** Connected wallet address, or "" when no wallet is linked. */
  address: string;
  /** True only when a wallet is linked; false → balances are null. */
  connected: boolean;
  /** Mock ETH balance (wei → ETH formatted), or null when disconnected. */
  ethBalance: string | null;
  /** Mock IMX balance, or null when disconnected. */
  imxBalance: string | null;
}

/**
 * On-chain staking position for a wallet (KLT, 18 decimals, as decimal strings).
 * Single source of truth — consumed by the API route via `chain.ts` and by the
 * web `StakingOverlay` via `api.ts`.
 */
export interface StakingInfo {
  /** Amount currently staked by the wallet. */
  stakedBalance: string;
  /** Rewards accrued and claimable. */
  pendingRewards: string;
  /** Total KLT staked across all wallets (global). */
  totalStaked: string;
  /** Wallet's spendable KLT balance. */
  kltBalance: string;
}
