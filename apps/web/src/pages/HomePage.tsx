import { useEffect } from "react";
import { useMe } from "../hooks/useMe";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { TopBar } from "../components/TopBar";
import { GamePage } from "./GamePage";
import { AuthOverlay } from "../components/AuthOverlay";
import { gameBridge } from "@kleeblatt/shared";
import type { MeResponse } from "@kleeblatt/shared";
import { useSessionContext } from "../hooks/useSessionContext";
import { claimWelcomeBonus } from "../lib/api";

/**
 * HomePage — minimal shell. All gameplay UI (quests, dialog, menus) runs
 * inside Phaser scenes. React only renders the TopBar (user info + logout)
 * and the Phaser game container.
 */
export function HomePage() {
  const { state: meState, logout, refresh } = useMe();
  const sessionCtx = useSessionContext();
  const sessionContext = sessionCtx.status === "ready" ? sessionCtx.context : null;
  const isGuest = sessionContext?.isGuest;
  // Guests never have a wallet — don't fetch or surface any wallet info.
  const { state: walletState } = useWalletBalance(meState.status === "authenticated" && !isGuest);

  // One-time welcome bonus: gameBridge fires wallet:welcomeClaim when a player
  // with a linked wallet starts a session. The server pays gas; the contract
  // enforces the once-only rule on-chain, so this is safe to call every login.
  useEffect(() => {
    const handler = (_payload: { address: string }): void => {
      void claimWelcomeBonus();
    };
    gameBridge.on("wallet:welcomeClaim", handler);
    return () => { gameBridge.off("wallet:welcomeClaim", handler); };
  }, []);

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
  // Only surface balances once a wallet is actually linked (Backend sets `connected`
  // and returns null balances otherwise, so guest / pre-connect users see no balance).
  const ethBalance = walletState.status === "ready" && walletState.data.connected ? walletState.data.ethBalance ?? undefined : undefined;
  const imxBalance = walletState.status === "ready" && walletState.data.connected ? walletState.data.imxBalance ?? undefined : undefined;

  return (
    <div className="app-shell">
      {meState.status === "authenticated" && (
        <TopBar
          meState={meState}
          hero={meState.me.hero}
          sessionContext={sessionContext}
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
