/**
 * FaucetOverlay — one-time 100 KLT welcome bonus claim.
 *
 * Flow:
 *  1. User clicks "Claim 100 KLT"
 *  2. MetaMask opens once — user signs an ownership message (no gas, no tx)
 *  3. Signature + message sent to server
 *  4. Server verifies signature matches linked wallet, calls claimFor on-chain,
 *     pays gas itself. Contract enforces once-only — second call is a hard error.
 */
import { useState } from "react";
import { claimWelcomeBonus } from "../lib/api";
import "../styles/staking.css";

interface Props {
  onClose: () => void;
  walletAddress: string;
}

type ClaimState =
  | { status: "idle" }
  | { status: "signing" }
  | { status: "claiming" }
  | { status: "done"; txHash: string }
  | { status: "error"; message: string };

const CLAIM_MESSAGE =
  "I confirm ownership of this wallet and request my one-time 100 KLT welcome bonus from Kleeblatt Adventure.";

export function FaucetOverlay({ onClose, walletAddress }: Props) {
  const [state, setState] = useState<ClaimState>({ status: "idle" });

  const handleClaim = async () => {
    // Step 1: request signature from MetaMask
    setState({ status: "signing" });

    const ethereum = (
      window as unknown as {
        ethereum?: {
          request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        };
      }
    ).ethereum;

    if (!ethereum) {
      setState({ status: "error", message: "No wallet found. Install MetaMask or another Web3 wallet." });
      return;
    }

    let signature: string;
    try {
      // eth_requestAccounts ensures the right account is active
      const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const from = accounts[0];

      // personal_sign — this is the MetaMask prompt, no gas charged
      signature = (await ethereum.request({
        method: "personal_sign",
        params: [CLAIM_MESSAGE, from],
      })) as string;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("user rejected") || msg.includes("4001")) {
        setState({ status: "error", message: "Signature rejected. You must sign to prove wallet ownership." });
      } else {
        setState({ status: "error", message: `Signing failed: ${msg}` });
      }
      return;
    }

    // Step 2: send signature to server — server verifies and calls claimFor
    setState({ status: "claiming" });
    const result = await claimWelcomeBonus(signature, CLAIM_MESSAGE);

    if (!result.ok) {
      setState({ status: "error", message: result.message });
      return;
    }

    const data = result.data;
    if (!data.ok) {
      const reasons: Record<string, string> = {
        already_claimed: "This wallet has already claimed the welcome bonus.",
        address_mismatch: "Signature address does not match your linked wallet.",
        invalid_signature: "Invalid signature. Please try again.",
        no_wallet: "No wallet linked to your account.",
        not_configured: "Faucet is not configured on this server.",
        chain_error: "On-chain transaction failed. Please try again.",
      };
      setState({ status: "error", message: reasons[data.reason ?? ""] ?? `Error: ${data.reason}` });
      return;
    }

    setState({ status: "done", txHash: data.txHash ?? "" });
  };

  const busy = state.status === "signing" || state.status === "claiming";

  return (
    <div className="auth-overlay">
      <div className="auth-modal staking-modal">
        <button type="button" className="auth-close" onClick={onClose} disabled={busy}>
          ×
        </button>
        <h2 className="auth-brand">Welcome Faucet</h2>
        <p className="auth-intro">
          Wallet: <strong>{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</strong>
        </p>

        <div className="faucet-box">
          <p className="faucet-amount">100 KLT</p>
          <p className="faucet-desc">
            One-time welcome bonus. Sign once with MetaMask to confirm ownership —
            the server pays gas, nothing is charged to your wallet.
          </p>

          {state.status === "idle" && (
            <button
              type="button"
              className="staking-btn staking-btn-stake"
              style={{ width: "100%" }}
              onClick={handleClaim}
            >
              Claim 100 KLT
            </button>
          )}

          {state.status === "signing" && (
            <button type="button" className="staking-btn staking-btn-stake" style={{ width: "100%" }} disabled>
              Waiting for signature…
            </button>
          )}

          {state.status === "claiming" && (
            <button type="button" className="staking-btn staking-btn-stake" style={{ width: "100%" }} disabled>
              Claiming on-chain…
            </button>
          )}

          {state.status === "done" && (
            <div className="faucet-claimed-badge">
              ✓ 100 KLT claimed!
              {state.txHash && (
                <span style={{ color: "#9aa0b5", fontWeight: 400 }}>
                  &nbsp;Tx: {state.txHash.slice(0, 10)}…
                </span>
              )}
            </div>
          )}

          {state.status === "error" && (
            <div className="staking-msg error">{state.message}</div>
          )}
        </div>
      </div>
    </div>
  );
}
