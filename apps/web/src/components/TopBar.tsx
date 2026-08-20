import { useState, useEffect } from "react";
import type { MeState } from "../hooks/useMe";
import type { Hero } from "@kleeblatt/shared";
import { linkWalletToProfile, WalletAuthError } from "../game/utils/walletAuth";
import { supabase } from "../game/utils/supabaseClient";
import { gameBridge } from "@kleeblatt/shared";
import type { SessionContext } from "../hooks/useSessionContext";

interface TopBarProps {
  meState: MeState;
  hero: Hero | null;
  walletAddress?: string;
  ethBalance?: string;
  imxBalance?: string;
  onLogout: () => void;
  onInventory?: () => void;
  onSettings?: () => void;
  sessionContext?: SessionContext | null;
}

export function TopBar({ meState, hero, walletAddress, ethBalance, imxBalance, onLogout, onInventory, onSettings, sessionContext }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const handleAddWallet = async (): Promise<void> => {
    setWalletLoading(true);
    setWalletError(null);
    gameBridge.emit("react:linkWallet");
    try {
      await linkWalletToProfile();
      window.location.reload();
    } catch (err) {
      setWalletError(err instanceof WalletAuthError ? err.message : "Failed to connect wallet.");
      setWalletLoading(false);
    }
  };

  const handleUpgradeAccount = async (): Promise<void> => {
    if (!supabase) return;
    setUpgradeLoading(true);
    gameBridge.emit("react:upgradeAccount");
    try {
      await supabase.auth.linkIdentity({ provider: "google" });
    } catch (err) {
      console.error("[TopBar] Upgrade failed:", err);
      setUpgradeLoading(false);
    }
  };

  useEffect(() => {
    const onSessionUpdate = (): void => {
      if (walletLoading) setWalletLoading(false);
    };
    gameBridge.on("session:initialized", onSessionUpdate);
    return () => { gameBridge.off("session:initialized", onSessionUpdate); };
  }, [walletLoading]);

  if (meState.status !== "authenticated") return null;

  const name = meState.me.displayName ?? meState.me.email;
  const pic = meState.me.picture;

  return (
    <nav className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo">
          <img src="/assets/ui/leaf.png" alt="" className="topbar-logo-icon" onError={(e) => (e.currentTarget.style.display = "none")} />
          <span className="topbar-title">Kleeblatt Adventure</span>
        </div>
        {hero && (
          <div className="topbar-hero">
            <span className="topbar-hero-name">{hero.heroName}</span>
            <span className="badge">Lv.{hero.level}</span>
          </div>
        )}
      </div>

      <div className="topbar-center">
        {onInventory && (
          <button type="button" className="topbar-link" onClick={onInventory}>
            Inventar
          </button>
        )}
        {onSettings && (
          <button type="button" className="topbar-link" onClick={onSettings}>
            Einstellungen
          </button>
        )}
      </div>

      <div className="topbar-right">
        {!walletAddress && !sessionContext?.isGuest && (
          <button type="button" className="topbar-wallet-btn" onClick={handleAddWallet} disabled={walletLoading}>
            {walletLoading ? "Connecting..." : "Add Wallet"}
          </button>
        )}
        {walletError && (<span className="topbar-wallet-error">{walletError}</span>)}
        {sessionContext?.isGuest && (
          <button type="button" className="topbar-upgrade-btn" onClick={handleUpgradeAccount} disabled={upgradeLoading}
            title="Your progress is stored locally. Link a Google account to save it permanently.">
            {upgradeLoading ? "Upgrading..." : "Upgrade to Full Account"}
          </button>
        )}
        {walletAddress && (
          <span className="topbar-wallet" title={walletAddress}>
            <img src="/assets/ui/wallet.png" alt="" className="topbar-wallet-icon" onError={(e) => (e.currentTarget.style.display = "none")} />
            {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
          </span>
        )}
        {ethBalance && (
          <span className="topbar-balance" title={ethBalance}>
            {ethBalance} ETH
          </span>
        )}
        {imxBalance && (
          <span className="topbar-balance" title={imxBalance}>
            {imxBalance} IMX
          </span>
        )}

        <div className="topbar-account" onClick={() => setMenuOpen(!menuOpen)}>
          {pic ? (
            <img src={pic} alt="" className="topbar-avatar" />
          ) : (
            <div className="topbar-avatar-placeholder">{name[0]?.toUpperCase() ?? "?"}</div>
          )}
          <span className="topbar-name">{name}</span>

          {menuOpen && (
            <div className="topbar-dropdown">
              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}