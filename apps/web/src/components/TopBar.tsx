import { useState } from "react";
import type { MeState } from "../hooks/useMe";
import type { Hero } from "@kleeblatt/shared";

interface TopBarProps {
  meState: MeState;
  hero: Hero | null;
  walletAddress?: string;
  ethBalance?: string;
  imxBalance?: string;
  onLogout: () => void;
  onInventory?: () => void;
  onSettings?: () => void;
}

export function TopBar({ meState, hero, walletAddress, ethBalance, imxBalance, onLogout, onInventory, onSettings }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

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
              <button type="button" className="topbar-dropdown-item" onClick={() => { onLogout(); setMenuOpen(false); }}>
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}