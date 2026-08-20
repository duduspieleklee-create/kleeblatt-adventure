import { useEffect, useState } from "react";
import { connectWallet, disconnectWallet as apiDisconnectWallet, fetchWallet } from "../lib/api";

type WalletStatus = "pending" | "ready" | "disconnected";

interface WalletState {
  address: string;
  status: WalletStatus;
  provider: string;
  depositAddress?: string;
  chainId?: number;
}

export function WalletCard() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const data = await fetchWallet();
    if (data) {
      setWallet(data);
    } else {
      setWallet(null);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleConnect = async () => {
    setBusy(true);
    setError(null);
    const mockAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const result = await connectWallet({ address: mockAddress, provider: "mock" });
    setBusy(false);
    if (result) {
      setWallet(result);
    } else {
      setError("Wallet-Verbindung fehlgeschlagen.");
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    setError(null);
    const updated = await apiDisconnectWallet();
    setBusy(false);
    if (updated) {
      setWallet(updated);
    }
  };

  const copyDeposit = async () => {
    if (wallet?.depositAddress) {
      await navigator.clipboard.writeText(wallet.depositAddress);
    }
  };

  const short = (addr?: string) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—");

  return (
    <section className="card">
      <h2>Wallet</h2>
      {!wallet || wallet.status === "disconnected" ? (
        <>
          <p className="muted">Noch keine Wallet verbunden.</p>
          <button type="button" className="primary" disabled={busy} onClick={handleConnect}>
            {busy ? "Verbinde …" : "Wallet verbinden"}
          </button>
        </>
      ) : (
        <div className="wallet">
          <div className="wallet-row">
            <span className="muted">Wallet</span>
            <strong title={wallet.address}>{short(wallet.address)}</strong>
          </div>
          <div className="wallet-row">
            <span className="muted">Deposit</span>
            <button type="button" onClick={copyDeposit} className="wallet-address">
              {short(wallet.depositAddress)}
            </button>
          </div>
          <div className="wallet-row">
            <span className="muted">Netzwerk</span>
            <span className="badge">Immutable zkEVM</span>
          </div>
          <button type="button" className="secondary" disabled={busy} onClick={handleDisconnect}>
            {busy ? "Trenne …" : "Trennen"}
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
