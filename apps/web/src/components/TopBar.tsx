import { useState, useEffect, type FormEvent } from "react";
import type { MeState } from "../hooks/useMe";
import { type Hero, validatePassword } from "@kleeblatt/shared";
import { linkWalletToProfile, WalletAuthError } from "../game/utils/walletAuth";
import { gameBridge } from "@kleeblatt/shared";
import { upgradeAccount } from "../lib/api";
import type { SessionContext } from "../hooks/useSessionContext";

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

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
  const [upEmail, setUpEmail] = useState("");
  const [upPassword, setUpPassword] = useState("");
  const [upConfirm, setUpConfirm] = useState("");
  const [upError, setUpError] = useState<string | null>(null);
  const [upSubmitting, setUpSubmitting] = useState(false);

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

  const handleUpgradeAccount = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setUpError(null);
    setUpSubmitting(true);
    try {
      const result = await upgradeAccount(upEmail.trim().toLowerCase(), upPassword);
      if (!result.ok) {
        setUpError(result.message);
        return;
      }
      // The session cookie is now a full account; reload to refresh the whole session context.
      window.location.reload();
    } catch {
      setUpError("Network error. Please try again.");
    } finally {
      setUpSubmitting(false);
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

  const upPwValid = validatePassword(upPassword).valid;
  const upConfirmValid = upConfirm.length > 0 && upConfirm === upPassword && upPwValid;
  const upCanSubmit =
    EMAIL_RE.test(upEmail.trim()) && upPwValid && upConfirmValid && !upSubmitting;

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
        {sessionContext?.isGuest && !upgradeOpen && (
          <button type="button" className="topbar-upgrade-btn" onClick={() => setUpgradeOpen(true)}
            title="Your progress is stored temporarily. Create an account to save it permanently.">
            Upgrade to Full Account
          </button>
        )}
        {sessionContext?.isGuest && upgradeOpen && (
          <form className="topbar-upgrade-form" onSubmit={handleUpgradeAccount}>
            <input className="topbar-upgrade-input" type="email" autoComplete="email"
              placeholder="you@example.com" value={upEmail} onChange={(e) => setUpEmail(e.target.value)} />
            <input className="topbar-upgrade-input" type="password" autoComplete="new-password"
              placeholder="Password" value={upPassword} onChange={(e) => setUpPassword(e.target.value)} />
            <input className="topbar-upgrade-input" type="password" autoComplete="new-password"
              placeholder="Confirm password" value={upConfirm} onChange={(e) => setUpConfirm(e.target.value)} />
            {upError && <span className="topbar-upgrade-error">{upError}</span>}
            <div className="topbar-upgrade-actions">
              <button type="submit" className="topbar-upgrade-btn" disabled={!upCanSubmit}>
                {upSubmitting ? "Upgrading..." : "Create account"}
              </button>
              <button type="button" className="topbar-upgrade-cancel"
                onClick={() => { setUpgradeOpen(false); setUpError(null); }}>
                Cancel
              </button>
            </div>
          </form>
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