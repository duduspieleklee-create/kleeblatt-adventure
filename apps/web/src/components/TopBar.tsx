import { useState, useEffect } from "react";
import type { MeState } from "../hooks/useMe";
import { type Hero } from "@kleeblatt/shared";
import { linkWalletToProfile, WalletAuthError } from "../game/utils/walletAuth";
import { gameBridge } from "@kleeblatt/shared";
import { UpgradeOverlay } from "./UpgradeOverlay";
import type { SessionContext } from "../hooks/useSessionContext";

/** Format a token amount for display: trim trailing zeros, add thousands separators. */
function formatToken(value: string | null | undefined): string {
  if (!value) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

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
  const [upgradeOpen, setUpgradeOpen] = useState(false);

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
    <>
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
          {sessionContext?.isGuest && !upgradeOpen && (
            <button type="button" className="topbar-upgrade-btn" onClick={() => setUpgradeOpen(true)}
              title="Your progress is stored temporarily. Create an account to save it permanently.">
              Upgrade to Full Account
            </button>
          )}
          {walletAddress && !sessionContext?.isGuest && (
            <span className="topbar-wallet" title={walletAddress}>
              <img src="/assets/ui/wallet.png" alt="" className="topbar-wallet-icon" onError={(e) => (e.currentTarget.style.display = "none")} />
              {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
            </span>
          )}
          {ethBalance && !sessionContext?.isGuest && (
            <span className="topbar-balance" title={`${formatToken(ethBalance)} ETH`}>
              {formatToken(ethBalance)} ETH
            </span>
          )}
          {imxBalance && !sessionContext?.isGuest && (
            <span className="topbar-balance" title={`${formatToken(imxBalance)} IMX`}>
              {formatToken(imxBalance)} IMX
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

      {sessionContext?.isGuest && upgradeOpen && (
        <UpgradeOverlay
          onClose={() => setUpgradeOpen(false)}
          onUpgraded={() => {
            // The session cookie is now a full account; reload to refresh the whole session context.
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
