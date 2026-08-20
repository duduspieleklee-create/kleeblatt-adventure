/**
 * chain.ts — server-side ethers.js singleton for on-chain calls.
 *
 * The game server is the `gameCaller` on KleeblattWelcomeFaucet.
 * Gas is paid by the deployer/dev wallet — players pay nothing.
 *
 * Usage:
 *   import { getFaucet, getStaking } from "../lib/chain.js";
 */

import { ethers } from "ethers";

// ─── Minimal ABIs ─────────────────────────────────────────────────────────────

const FAUCET_ABI = [
  "function claimFor(address recipient) external",
  "function canClaim(address recipient) external view returns (bool)",
  "function claimed(address) external view returns (bool)",
] as const;

const STAKING_ABI = [
  "function stake(uint256 amount) external",
  "function unstake(uint256 amount) external",
  "function claimRewards() external",
  "function pendingRewards(address account) external view returns (uint256)",
  "function stakedBalance(address account) external view returns (uint256)",
  "function totalStaked() external view returns (uint256)",
] as const;

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
] as const;

// ─── Singleton ───────────────────────────────────────────────────────────────

let _provider: ethers.JsonRpcProvider | null = null;
let _wallet: ethers.Wallet | null = null;
let _faucet: ethers.Contract | null = null;
let _staking: ethers.Contract | null = null;
let _klt: ethers.Contract | null = null;

function init(): void {
  const rpc = process.env.IMX_TESTNET_RPC ?? "https://rpc.testnet.immutable.com";
  const privateKey = process.env.IMX_TESTNET_PRIVATE_KEY ?? "";
  const faucetAddress = process.env.FAUCET_CONTRACT_ADDRESS ?? "";
  const stakingAddress = process.env.STAKING_CONTRACT_ADDRESS ?? "";
  const kltAddress = process.env.KLT_CONTRACT_ADDRESS ?? "";

  if (!privateKey) {
    // On-chain features disabled — all on-chain calls are skipped gracefully.
    return;
  }

  try {
    _provider = new ethers.JsonRpcProvider(rpc);
    _wallet = new ethers.Wallet(privateKey, _provider);
    if (faucetAddress) _faucet = new ethers.Contract(faucetAddress, FAUCET_ABI, _wallet);
    if (stakingAddress) _staking = new ethers.Contract(stakingAddress, STAKING_ABI, _provider);
    if (kltAddress) _klt = new ethers.Contract(kltAddress, ERC20_ABI, _provider);
  } catch (err) {
    console.warn("[chain] Failed to initialise on-chain client:", err);
  }
}

init();

// ─── Typed wrappers ──────────────────────────────────────────────────────────

interface FaucetContract {
  claimFor(recipient: string): Promise<{ hash: string; wait(): Promise<unknown> }>;
  canClaim(recipient: string): Promise<boolean>;
}

export interface StakingInfo {
  stakedBalance: string;   // in KLT (18 decimals, as string)
  pendingRewards: string;  // in KLT (18 decimals, as string)
  totalStaked: string;     // in KLT (18 decimals, as string)
  kltBalance: string;      // wallet KLT balance (18 decimals, as string)
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

/**
 * Fetch staking info for a given wallet address.
 * Returns null if staking contract is not configured.
 */
export async function getStakingInfo(address: string): Promise<StakingInfo | null> {
  if (!_staking) return null;
  try {
    const [stakedBalance, pendingRewards, totalStaked, kltBalance] = await Promise.all([
      (_staking as unknown as { stakedBalance(a: string): Promise<bigint> }).stakedBalance(address),
      (_staking as unknown as { pendingRewards(a: string): Promise<bigint> }).pendingRewards(address),
      (_staking as unknown as { totalStaked(): Promise<bigint> }).totalStaked(),
      _klt
        ? (_klt as unknown as { balanceOf(a: string): Promise<bigint> }).balanceOf(address)
        : Promise.resolve(0n),
    ]);
    return {
      stakedBalance: ethers.formatUnits(stakedBalance, 18),
      pendingRewards: ethers.formatUnits(pendingRewards, 18),
      totalStaked: ethers.formatUnits(totalStaked, 18),
      kltBalance: ethers.formatUnits(kltBalance, 18),
    };
  } catch (err) {
    console.warn("[chain] getStakingInfo error:", err);
    return null;
  }
}
