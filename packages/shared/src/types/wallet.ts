/** Wallet shapes (P3 – Mock-Wallet, extended for P9 Immutable-style login) */

export type WalletStatus = "pending" | "ready" | "disconnected";

export interface WalletResponse {
  address: string;
  status: WalletStatus;
  provider: string;
  depositAddress?: string;
  chainId?: number;
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
