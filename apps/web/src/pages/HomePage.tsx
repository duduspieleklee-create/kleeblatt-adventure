import { useMe } from "../hooks/useMe";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { TopBar } from "../components/TopBar";
import { GamePage } from "./GamePage";
import { AuthOverlay } from "../components/AuthOverlay";
import { gameBridge } from "@kleeblatt/shared";
import type { MeResponse } from "@kleeblatt/shared";

/**
 * HomePage — minimal shell. All gameplay UI (quests, dialog, menus) runs
 * inside Phaser scenes. React only renders the TopBar (user info + logout)
 * and the Phaser game container.
 */
export function HomePage() {
  const { state: meState, logout, refresh } = useMe();
  const { state: walletState } = useWalletBalance(meState.status === "authenticated");

  const handleLogout = () => {
    void logout();
    // Tell Phaser to return to the login scene after the session ends.
    gameBridge.emit("logout");
  };

  const handleAuthenticated = (_me: MeResponse): void => {
    // Refresh React auth state (shows TopBar) and tell Phaser to proceed.
    void refresh();
    gameBridge.emit("auth:authenticated");
  };

  const walletAddress = walletState.status === "ready" ? walletState.data.address : undefined;
  const ethBalance = walletState.status === "ready" ? walletState.data.ethBalance : undefined;
  const imxBalance = walletState.status === "ready" ? walletState.data.imxBalance : undefined;

  return (
    <div className="app-shell">
      {meState.status === "authenticated" && (
        <TopBar
          meState={meState}
          hero={meState.me.hero}
          walletAddress={walletAddress}
          ethBalance={ethBalance}
          imxBalance={imxBalance}
          onLogout={handleLogout}
        />
      )}
      <div className="app-body game-wrapper">
        <GamePage />
      </div>
      {meState.status === "anonymous" && (
        <AuthOverlay onAuthenticated={handleAuthenticated} />
      )}
    </div>
  );
}
