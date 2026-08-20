/**
 * StakingOverlay — stake / unstake / claim rewards for KLT.
 *
 * Access guard: only rendered when the user is wallet-authenticated and has a
 * linked wallet address (enforced in TopBar before this component is mounted).
 */
import { useState, useEffect, useCallback } from "react";
import { fetchStakingInfo, type StakingInfo } from "../lib/api";
import "../styles/staking.css";

interface Props {
  onClose: () => void;
  walletAddress: string;
}

type TxState =
  | { status: "idle" }
  | { status: "pending"; label: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

/** Format a token amount string to 4 decimal places for display. */
function fmt(val: string | undefined): string {
  if (!val) return "—";
  const n = parseFloat(val);
  if (Number.isNaN(n)) return val;
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

/** Call the staking contract method via MetaMask (window.ethereum). */
async function callStakingContract(
  method: "stake" | "unstake" | "claimRewards",
  amount?: bigint,
): Promise<string> {
  const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
  if (!ethereum) throw new Error("No wallet found. Install MetaMask or another Web3 wallet.");

  const stakingAddress = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS;
  const kltAddress = import.meta.env.VITE_KLT_CONTRACT_ADDRESS;
  if (!stakingAddress) throw new Error("Staking contract address not configured.");

  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
  const from = accounts[0];

  // ── If staking: first approve KLT spend ──────────────────────────────────
  if (method === "stake" && amount !== undefined && kltAddress) {
    // approve(stakingAddress, amount)
    const approveData =
      "0x095ea7b3" +
      stakingAddress.toLowerCase().replace("0x", "").padStart(64, "0") +
      amount.toString(16).padStart(64, "0");

    await ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from, to: kltAddress, data: approveData }],
    });
  }

  // ── Build calldata ────────────────────────────────────────────────────────
  let data: string;
  if (method === "stake" && amount !== undefined) {
    // stake(uint256)  selector: 0xa694fc3a
    data = "0xa694fc3a" + amount.toString(16).padStart(64, "0");
  } else if (method === "unstake" && amount !== undefined) {
    // unstake(uint256)  selector: 0x2e17de78
    data = "0x2e17de78" + amount.toString(16).padStart(64, "0");
  } else {
    // claimRewards()  selector: 0x372500ab
    data = "0x372500ab";
  }

  const txHash = (await ethereum.request({
    method: "eth_sendTransaction",
    params: [{ from, to: stakingAddress, data }],
  })) as string;

  return txHash;
}

export function StakingOverlay({ onClose, walletAddress }: Props) {
  const [info, setInfo] = useState<StakingInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  const loadInfo = useCallback(async () => {
    setLoadError(null);
    const result = await fetchStakingInfo();
    if (result.ok) {
      setInfo(result.data);
    } else {
      setLoadError(result.message);
    }
  }, []);

  useEffect(() => {
    void loadInfo();
  }, [loadInfo]);

  const busy = tx.status === "pending";

  const handleStake = async () => {
    const n = parseFloat(stakeAmount);
    if (!stakeAmount || Number.isNaN(n) || n <= 0) return;
    setTx({ status: "pending", label: "Approving + Staking…" });
    try {
      const amountWei = BigInt(Math.floor(n * 1e18));
      const txHash = await callStakingContract("stake", amountWei);
      setTx({ status: "success", message: `Staked! Tx: ${txHash.slice(0, 10)}…` });
      setStakeAmount("");
      await loadInfo();
    } catch (err) {
      setTx({ status: "error", message: err instanceof Error ? err.message : "Stake failed." });
    }
  };

  const handleUnstake = async () => {
    const n = parseFloat(unstakeAmount);
    if (!unstakeAmount || Number.isNaN(n) || n <= 0) return;
    setTx({ status: "pending", label: "Unstaking…" });
    try {
      const amountWei = BigInt(Math.floor(n * 1e18));
      const txHash = await callStakingContract("unstake", amountWei);
      setTx({ status: "success", message: `Unstaked! Tx: ${txHash.slice(0, 10)}…` });
      setUnstakeAmount("");
      await loadInfo();
    } catch (err) {
      setTx({ status: "error", message: err instanceof Error ? err.message : "Unstake failed." });
    }
  };

  const handleClaim = async () => {
    setTx({ status: "pending", label: "Claiming rewards…" });
    try {
      const txHash = await callStakingContract("claimRewards");
      setTx({ status: "success", message: `Claimed! Tx: ${txHash.slice(0, 10)}…` });
      await loadInfo();
    } catch (err) {
      setTx({ status: "error", message: err instanceof Error ? err.message : "Claim failed." });
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal staking-modal">
        <button type="button" className="auth-close" onClick={onClose} disabled={busy}>×</button>
        <h2 className="auth-brand">KLT Staking</h2>
        <p className="auth-intro">
          Wallet: <strong>{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</strong>
        </p>

        {loadError && (
          <div className="staking-msg error">{loadError}</div>
        )}

        {info && (
          <>
            <p className="staking-section-title">Your Position</p>
            <div className="staking-stats">
              <div className="staking-stat">
                <div className="staking-stat-label">Staked</div>
                <div className="staking-stat-value highlight">{fmt(info.stakedBalance)} KLT</div>
              </div>
              <div className="staking-stat">
                <div className="staking-stat-label">Pending Rewards</div>
                <div className="staking-stat-value highlight">{fmt(info.pendingRewards)} KLT</div>
              </div>
              <div className="staking-stat">
                <div className="staking-stat-label">Wallet Balance</div>
                <div className="staking-stat-value">{fmt(info.kltBalance)} KLT</div>
              </div>
              <div className="staking-stat">
                <div className="staking-stat-label">Total Staked (pool)</div>
                <div className="staking-stat-value">{fmt(info.totalStaked)} KLT</div>
              </div>
            </div>
          </>
        )}

        <hr className="staking-divider" />

        {/* ── Stake ──────────────────────────────────────────────────── */}
        <p className="staking-section-title">Stake KLT</p>
        <div className="staking-input-row">
          <input
            className="staking-input"
            type="number"
            min="0"
            step="any"
            placeholder="Amount"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            disabled={busy}
          />
          {info && (
            <button
              type="button"
              className="staking-max-btn"
              onClick={() => setStakeAmount(info.kltBalance)}
              disabled={busy}
            >
              MAX
            </button>
          )}
        </div>

        {/* ── Unstake ────────────────────────────────────────────────── */}
        <p className="staking-section-title">Unstake KLT</p>
        <div className="staking-input-row">
          <input
            className="staking-input"
            type="number"
            min="0"
            step="any"
            placeholder="Amount"
            value={unstakeAmount}
            onChange={(e) => setUnstakeAmount(e.target.value)}
            disabled={busy}
          />
          {info && (
            <button
              type="button"
              className="staking-max-btn"
              onClick={() => setUnstakeAmount(info.stakedBalance)}
              disabled={busy}
            >
              MAX
            </button>
          )}
        </div>

        <div className="staking-actions">
          <button
            type="button"
            className="staking-btn staking-btn-stake"
            onClick={handleStake}
            disabled={busy || !stakeAmount || parseFloat(stakeAmount) <= 0}
          >
            {busy && tx.status === "pending" && tx.label.includes("Staking") ? tx.label : "Stake"}
          </button>
          <button
            type="button"
            className="staking-btn staking-btn-unstake"
            onClick={handleUnstake}
            disabled={busy || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
          >
            {busy && tx.status === "pending" && tx.label.includes("Unstaking") ? tx.label : "Unstake"}
          </button>
          <button
            type="button"
            className="staking-btn staking-btn-claim"
            onClick={handleClaim}
            disabled={busy || !info || parseFloat(info.pendingRewards) <= 0}
          >
            {busy && tx.status === "pending" && tx.label.includes("Claiming") ? tx.label : "Claim Rewards"}
          </button>
        </div>

        {(tx.status === "success" || tx.status === "error") && (
          <div className={`staking-msg ${tx.status}`}>{tx.message}</div>
        )}
      </div>
    </div>
  );
}
