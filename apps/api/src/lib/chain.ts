/**
 * chain.ts — server-side ethers.js singleton for on-chain calls.
 *
 * The game server is the `gameCaller` on KleeblattWelcomeFaucet.
 * Gas is paid by the deployer/dev wallet — players pay nothing.
 *
 * Usage:
 *   import { getFaucet, getStakingInfo } from "../lib/chain.js";
 */

import { ethers } from "ethers";
import type { StakingInfo } from "@kleeblatt/shared";

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

// ─── Typed contract views ────────────────────────────────────────────────────
// ethers.Contract is untyped (string-index signature), so we define standalone
// shapes and cast the instances once at construction.

interface FaucetContract {
  claimFor(recipient: string): Promise<ethers.ContractTransactionResponse>;
  canClaim(recipient: string): Promise<boolean>;
  claimed(recipient: string): Promise<boolean>;
}

interface StakingContract {
  stakedBalance(account: string): Promise<bigint>;
  pendingRewards(account: string): Promise<bigint>;
  totalStaked(): Promise<bigint>;
}

interface Erc20Contract {
  balanceOf(account: string): Promise<bigint>;
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let _provider: ethers.JsonRpcProvider | null = null;
let _faucet: FaucetContract | null = null;
let _staking: StakingContract | null = null;
let _klt: Erc20Contract | null = null;

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
    const wallet = new ethers.Wallet(privateKey, _provider);
    if (faucetAddress) _faucet = new ethers.Contract(faucetAddress, FAUCET_ABI, wallet) as unknown as FaucetContract;
    if (stakingAddress) _staking = new ethers.Contract(stakingAddress, STAKING_ABI, _provider) as unknown as StakingContract;
    if (kltAddress) _klt = new ethers.Contract(kltAddress, ERC20_ABI, _provider) as unknown as Erc20Contract;
  } catch (err) {
    console.warn("[chain] Failed to initialise on-chain client:", err);
  }
}

init();

// ─── Typed wrappers ──────────────────────────────────────────────────────────

/**
 * Returns the faucet contract connected to the dev wallet, or null if
 * env vars are not configured. Callers must handle the null case gracefully.
 */
export function getFaucet(): FaucetContract | null {
  return _faucet;
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
      _staking.stakedBalance(address),
      _staking.pendingRewards(address),
      _staking.totalStaked(),
      _klt ? _klt.balanceOf(address) : Promise.resolve(0n),
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
