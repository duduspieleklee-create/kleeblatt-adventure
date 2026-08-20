/**
 * ShopOverlay — buy a (FAKE, test-only) "1 Month Premium" pass for 50 KLT.
 *
 * The premium status is NOT enforced anywhere yet — this is a front-end demo
 * hook. On "Buy" we do a REAL ERC-20 KLT `transfer` of 50 KLT to the shop
 * treasury on the Immutable testnet (chainId 13473) via MetaMask, mirroring the
 * app's existing raw `window.ethereum` flow (see StakingOverlay). Once a tx is
 * broadcast we flip a local "premium active" flag — TopBar reads it and paints a
 * neon glow on the top bar.
 *
 * Immutable SDK note: @imtbl/sdk exposes `checkout` (commerce / pay-with-crypto)
 * and `orderbook` (buy/sell NFT orders) but no turnkey subscription-shop module.
 * The production path would swap this MetaMask transfer for the Immutable Checkout
 * widget; for now the direct transfer is the simplest testable on-chain action.
 */
import { useState } from "react";
import "../styles/staking.css";

interface Props {
  onClose: () => void;
  walletAddress: string;
  /** Called once a real on-testnet tx has been broadcast (premium "activated"). */
  onPurchased: () => void;
}

const PRICE_KLT = 50;
const IMMUTABLE_TESTNET_CHAIN_ID = "0x349d"; // 13473 — Immutable zkEVM Testnet
// Treasury receives the 50 KLT. Override with VITE_SHOP_TREASURY_ADDRESS.
const TREASURY_ADDRESS =
  import.meta.env.VITE_SHOP_TREASURY_ADDRESS ??
  "0xb117F9aA2bC3C4CE63E8A4BB78f1fA7f80731Bd3";

type BuyState =
  | { status: "idle" }
  | { status: "switching" }
  | { status: "signing" }
  | { status: "pending"; txHash: string }
  | { status: "success"; txHash: string }
  | { status: "error"; message: string };

export function ShopOverlay({ onClose, walletAddress, onPurchased }: Props) {
  const [state, setState] = useState<BuyState>({ status: "idle" });

  const handleBuy = async (): Promise<void> => {
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

    const kltAddress = import.meta.env.VITE_KLT_CONTRACT_ADDRESS;
    if (!kltAddress) {
      setState({ status: "error", message: "KLT contract address not configured." });
      return;
    }

    try {
      // 1. Make sure we are on the Immutable testnet (13473).
      const current = (await ethereum.request({ method: "eth_chainId" })) as string;
      if (current.toLowerCase() !== IMMUTABLE_TESTNET_CHAIN_ID.toLowerCase()) {
        setState({ status: "switching" });
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: IMMUTABLE_TESTNET_CHAIN_ID }],
          });
        } catch (swErr) {
          const m = swErr instanceof Error ? swErr.message : String(swErr);
          if (m.toLowerCase().includes("user rejected") || m.includes("4001")) {
            setState({ status: "error", message: "Network switch rejected." });
          } else {
            setState({ status: "error", message: `Switch to Immutable Testnet (13473) failed: ${m}` });
          }
          return;
        }
      }

      // 2. Active account.
      setState({ status: "signing" });
      const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const from = accounts[0];

      // 3. transfer(address,uint256) → selector 0xa9059cbb.
      const amountWei = BigInt(Math.floor(PRICE_KLT * 1e18));
      const data =
        "0xa9059cbb" +
        TREASURY_ADDRESS.toLowerCase().replace("0x", "").padStart(64, "0") +
        amountWei.toString(16).padStart(64, "0");

      const txHash = (await ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from, to: kltAddress, data }],
      })) as string;

      // Tx broadcast = "done on testnet" → unlock the neon top bar.
      setState({ status: "success", txHash });
      onPurchased();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("user rejected") || msg.includes("4001")) {
        setState({ status: "error", message: "Transaction rejected in wallet." });
      } else {
        setState({ status: "error", message: `Purchase failed: ${msg}` });
      }
    }
  };

  const busy =
    state.status === "switching" || state.status === "signing" || state.status === "pending";

  return (
    <div className="auth-overlay">
      <div className="auth-modal staking-modal">
        <button type="button" className="auth-close" onClick={onClose} disabled={busy}>
          ×
        </button>
        <h2 className="auth-brand">Kleeblatt Shop</h2>
        <p className="auth-intro">
          Wallet: <strong>{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</strong>
        </p>

        <div className="shop-box">
          <div className="shop-badge">PREMIUM · TEST</div>
          <p className="shop-title">1 Month Premium</p>
          <p className="shop-price">{PRICE_KLT} KLT</p>
          <p className="shop-desc">
            Unlock the neon top-bar treatment (test only). This pays {PRICE_KLT} KLT to the
            shop treasury on the Immutable testnet. Premium is a front-end demo — not yet
            enforced server-side.
          </p>

          {state.status === "idle" && (
            <button
              type="button"
              className="staking-btn staking-btn-stake"
              style={{ width: "100%" }}
              onClick={handleBuy}
            >
              Buy with KLT
            </button>
          )}
          {state.status === "switching" && (
            <button type="button" className="staking-btn staking-btn-stake" style={{ width: "100%" }} disabled>
              Switching network…
            </button>
          )}
          {state.status === "signing" && (
            <button type="button" className="staking-btn staking-btn-stake" style={{ width: "100%" }} disabled>
              Confirm in wallet…
            </button>
          )}
          {state.status === "pending" && (
            <button type="button" className="staking-btn staking-btn-stake" style={{ width: "100%" }} disabled>
              Broadcasting…
            </button>
          )}
          {state.status === "success" && (
            <div className="shop-owned-badge">✓ Premium activated! Enjoy the neon.</div>
          )}
          {state.status === "error" && (
            <div className="staking-msg error">{state.message}</div>
          )}
        </div>

        {state.status === "success" && (
          <p className="shop-tx-hint">Tx: {state.txHash.slice(0, 12)}… (premium unlocked on broadcast)</p>
        )}
      </div>
    </div>
  );
}
