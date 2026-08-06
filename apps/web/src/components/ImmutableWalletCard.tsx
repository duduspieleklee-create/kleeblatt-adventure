import { useEffect, useState } from "react";
import {
  connectWallet,
  connectImmutableWallet,
  disconnectWallet as apiDisconnectWallet,
  fetchWallet,
  getImmutableDepositAddress,
  getWalletDepositAddress
} from "../lib/api";

type WalletStatus = "pending" | "ready" | "disconnected";

interface WalletState {
  address: string;
  status: WalletStatus;
  provider: string;
  depositAddress?: string;
  chainId?: number;
}

export function ImmutableWalletCard() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnectOptions, setShowConnectOptions] = useState(false);

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

  const handleConnect = async (provider: string) => {
    setBusy(true);
    setError(null);
    setShowConnectOptions(false);
    
    try {
      // For demo purposes, we'll generate a mock address
      // In production, this would be handled by the wallet provider
      const mockAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      
      let result;
      if (provider === 'immutable') {
        result = await connectImmutableWallet({ address: mockAddress, provider: 'immutable' });
      } else {
        result = await connectWallet({ address: mockAddress, provider: 'mock' });
      }
      
      setBusy(false);
      if (result) {
        setWallet(result);
        
        // Also fetch the deposit address for display
        if (result.provider === 'immutable') {
          const depositAddr = await getImmutableDepositAddress();
          if (depositAddr) {
            setWallet({...result, depositAddress: depositAddr});
          }
        } else {
          const depositAddr = await getWalletDepositAddress();
          if (depositAddr) {
            setWallet({...result, depositAddress: depositAddr});
          }
        }
      } else {
        setError("Wallet-Verbindung fehlgeschlagen.");
      }
    } catch (err) {
      setBusy(false);
      setError("Fehler bei Wallet-Verbindung: " + (err as Error).message);
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
          <button 
            type="button" 
            className="primary" 
            disabled={busy} 
            onClick={() => setShowConnectOptions(!showConnectOptions)}
          >
            {busy ? "Verbinde …" : "Wallet verbinden"}
          </button>
          
          {showConnectOptions && (
            <div className="connect-options">
              <button 
                type="button" 
                className="secondary" 
                onClick={() => handleConnect('mock')}
                disabled={busy}
              >
                Mock-Wallet
              </button>
              <button 
                type="button" 
                className="secondary" 
                onClick={() => handleConnect('immutable')}
                disabled={busy}
              >
                Immutable Wallet
              </button>
            </div>
          )}
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
          <div className="wallet-row">
            <span className="muted">Provider</span>
            <span className="badge">{wallet.provider}</span>
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