/** Wallet shapes (P3 – Mock-Wallet) */

export type WalletStatus = "pending" | "ready";

export interface WalletResponse {
  address: string;
  status: WalletStatus;
  /** "mock" im Prototyp (kein echter MPC-Provider) */
  provider: string;
}
