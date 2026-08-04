import { useState, useCallback, useEffect } from "react";
import { useMe } from "../hooks/useMe";
import { useHero } from "../hooks/useHero";
import { TopBar } from "../components/TopBar";
import { LandingPage } from "../components/LandingPage";
import { AuthOverlay } from "../components/AuthOverlay";
import { DebugConsole } from "../components/DebugConsole";
import { MatchPage } from "./MatchPage";
import type { HeroResponse } from "@kleeblatt/shared";

export function HomePage() {
  const { state: meState, logout, refresh: refreshMe } = useMe();
  const hero = useHero();
  const [showAuth, setShowAuth] = useState(false);

  const isAuthenticated = meState.status === "authenticated";

  const handlePlay = useCallback(() => {
    if (!isAuthenticated) {
      setShowAuth(true);
    } else if (hero.state.status === "none") {
      setShowAuth(true);
    }
  }, [isAuthenticated, hero.state.status]);

  const handleHeroCreated = useCallback(
    (_resp: HeroResponse) => {
      void hero.refresh();
      void refreshMe();
      setShowAuth(false);
    },
    [hero, refreshMe],
  );

  const handleAuthenticated = useCallback(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (isAuthenticated) setShowAuth(false);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <LandingPage onPlay={handlePlay} />
        {showAuth && (
          <AuthOverlay
            meState={meState}
            onAuthenticated={handleAuthenticated}
            onHeroCreated={handleHeroCreated}
            onClose={() => setShowAuth(false)}
          />
        )}
        <DebugConsole />
      </div>
    );
  }

  if (hero.state.status === "loading") {
    return (
      <div className="app-shell">
        <TopBar meState={meState} hero={null} walletAddress={undefined} onLogout={() => void logout()} />
        <div className="app-body app-center">
          <p className="muted">Lade Held-Daten …</p>
        </div>
        <DebugConsole />
      </div>
    );
  }

  if (hero.state.status === "error") {
    return (
      <div className="app-shell">
        <TopBar meState={meState} hero={null} walletAddress={undefined} onLogout={() => void logout()} />
        <div className="app-body app-center">
          <p className="error">{hero.state.message}</p>
        </div>
        <DebugConsole />
      </div>
    );
  }

  if (hero.state.status === "none") {
    return (
      <div className="app-shell">
        <TopBar meState={meState} hero={null} walletAddress={undefined} onLogout={() => void logout()} />
        <div className="app-body">
          <LandingPage onPlay={handlePlay} />
        </div>
        {showAuth && (
          <AuthOverlay
            meState={meState}
            onAuthenticated={handleAuthenticated}
            onHeroCreated={handleHeroCreated}
            onClose={() => setShowAuth(false)}
          />
        )}
        <DebugConsole />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopBar
        meState={meState}
        hero={hero.state.hero}
        walletAddress={undefined}
        onLogout={() => void logout()}
      />
      <div className="app-body game-wrapper">
        <MatchPage
          heroClass={hero.state.hero.class}
          heroLevel={hero.state.hero.level}
          equippedStats={{}}
        />
      </div>
      <DebugConsole />
    </div>
  );
}