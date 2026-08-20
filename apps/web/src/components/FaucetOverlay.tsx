/**
 * FaucetOverlay — one-time 100 KLT welcome bonus claim.
 *
 * Access guard: only rendered when the user is wallet-authenticated and has a
 * linked wallet address (enforced in TopBar before this component is mounted).
 *
 * The server pays gas via the deployer wallet — no MetaMask prompt.
 * The on-chain contract enforces the once-only rule regardless of how many
 * times this endpoint is called.
 */
import { useState, useEffect } from "react";
import { claimWelcomeBonus } from "../lib/api";
import "../styles/staking.css";

interface Props {
  onClose: () => void;
  walletAddress: string;
}

type ClaimState =
  | { status: "idle" }
  | { status: "claiming" }
  | { status: "claimed"; txHash?: string }
  | { status: "already_claimed" }
  | { status: "error"; message: string };

export function FaucetOverlay({ onClose, walletAddress }: Props) {
  const [claimState, setClaimState] = useState<ClaimState>({ status: "idle" });

  // Auto-check on mount whether already claimed by calling the endpoint once.
  // The endpoint is idempotent — it returns { ok: false, reason: "already_claimed" } safely.
  useEffect(() => {
    // We don't auto-claim on mount — user must click the button intentionally.
    // Nothing to do here.
  }, []);

  const handleClaim = async () => {
    setClaimState({ status: "claiming" });
    const result = await claimWelcomeBonus();
    if (!result.ok) {
      setClaimState({ status: "error", message: result.message });
      return;
    }
    const data = result.data;
    if (!data.ok) {
      if (data.reason === "already_claimed") {
        setClaimState({ status: "already_claimed" });
      } else if (data.reason === "not_configured") {
        setClaimState({ status: "error", message: "Faucet is not yet configured on this server." });
      } else {
        setClaimState({ status: "error", message: data.reason ?? "Unknown error." });
      }
      return;
    }
    setClaimState({ status: "claimed", txHash: data.txHash });
  };

  const busy = claimState.status === "claiming";

  return (
    <div className="auth-overlay">
      <div className="auth-modal staking-modal">
        <button type="button" className="auth-close" onClick={onClose} disabled={busy}>×</button>
        <h2 className="auth-brand">Welcome Faucet</h2>
        <p className="auth-intro">
          Wallet: <strong>{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</strong>
        </p>

        <div className="faucet-box">
          <p className="faucet-amount">100 KLT</p>
          <p className="faucet-desc">
            Claim your one-time welcome bonus of 100 Kleeblatt Tokens.
            The server pays gas — nothing required from your wallet.
          </p>

          {claimState.status === "idle" && (
            <button
              type="button"
              className="staking-btn staking-btn-stake"
              style={{ width: "100%" }}
              onClick={handleClaim}
            >
              Claim 100 KLT
            </button>
          )}

          {claimState.status === "claiming" && (
            <button type="button" className="staking-btn staking-btn-stake" style={{ width: "100%" }} disabled>
              Claiming…
            </button>
          )}

          {(claimState.status === "claimed" || claimState.status === "already_claimed") && (
            <div className="faucet-claimed-badge">
              ✓ {claimState.status === "already_claimed" ? "Already claimed" : "Claimed!"}
              {claimState.status === "claimed" && claimState.txHash && (
                <span style={{ color: "#9aa0b5", fontWeight: 400 }}>
                  &nbsp;Tx: {claimState.txHash.slice(0, 10)}…
                </span>
              )}
            </div>
          )}

          {claimState.status === "error" && (
            <div className="staking-msg error">{claimState.message}</div>
          )}
        </div>
      </div>
    </div>
  );
}
