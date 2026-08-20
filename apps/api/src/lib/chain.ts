/**
 * chain.ts — server-side ethers.js singleton for on-chain calls.
 *
 * The game server is the `gameCaller` on KleeblattWelcomeFaucet.
 * Gas is paid by the deployer/dev wallet — players pay nothing.
 *
 * Usage:
 *   import { getFaucet } from "../lib/chain.js";
 *   const faucet = getFaucet();
 *   if (faucet) await faucet.claimFor(recipientAddress);
 */

import { ethers } from "ethers";

// ─── Minimal ABI ─────────────────────────────────────────────────────────────

const FAUCET_ABI = [
  "function claimFor(address recipient) external",
  "function canClaim(address recipient) external view returns (bool)",
  "function claimed(address) external view returns (bool)",
] as const;

// ─── Singleton ───────────────────────────────────────────────────────────────

let _provider: ethers.JsonRpcProvider | null = null;
let _wallet: ethers.Wallet | null = null;
let _faucet: ethers.Contract | null = null;

function init(): void {
  const rpc = process.env.IMX_TESTNET_RPC ?? "https://rpc.testnet.immutable.com";
  const privateKey = process.env.IMX_TESTNET_PRIVATE_KEY ?? "";
  const faucetAddress = process.env.FAUCET_CONTRACT_ADDRESS ?? "";

  if (!privateKey || !faucetAddress) {
    // On-chain features disabled — welcome bonus will be skipped gracefully.
    return;
  }

  try {
    _provider = new ethers.JsonRpcProvider(rpc);
    _wallet = new ethers.Wallet(privateKey, _provider);
    _faucet = new ethers.Contract(faucetAddress, FAUCET_ABI, _wallet);
  } catch (err) {
    console.warn("[chain] Failed to initialise on-chain client:", err);
  }
}

init();

// Typed wrapper so callers don't have to cast Contract methods.
interface FaucetContract {
  claimFor(recipient: string): Promise<{ hash: string; wait(): Promise<unknown> }>;
  canClaim(recipient: string): Promise<boolean>;
}

/**
 * Returns the faucet contract connected to the dev wallet, or null if
 * env vars are not configured. Callers must handle the null case gracefully.
 */
export function getFaucet(): FaucetContract | null {
  return _faucet as unknown as FaucetContract | null;
}

/**
 * Check whether `address` can still receive the welcome bonus.
 * Returns false (safe fallback) if the chain client is not configured.
 */
export async function canClaimWelcome(address: string): Promise<boolean> {
  const f = getFaucet();
  if (!f) return false;
  try {
    return await f.canClaim(address);
  } catch {
    return false;
  }
}
