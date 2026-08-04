import { useState, useCallback, useEffect, useMemo } from "react";
import type { HeroResponse, OnboardingPath } from "@kleeblatt/shared";
import { useMe } from "../hooks/useMe";
import { useHero } from "../hooks/useHero";
import { useOnboarding } from "../hooks/useOnboarding";
import { TopBar } from "../components/TopBar";
import { LandingPage } from "../components/LandingPage";
import { AuthOverlay } from "../components/AuthOverlay";
import { DebugConsole } from "../components/DebugConsole";
import { OnboardingChoice } from "../components/OnboardingChoice";
import { NeulingIntro } from "../components/NeulingIntro";
import { ExperteIntro } from "../components/ExperteIntro";
import { MatchPage } from "./MatchPageSimple";

/** Summiere Stats aller ausgerüsteten Items. */
function sumEquippedStats(
  hero: { equipped: Record<string, string> },
  inventory: Array<{ itemId: string; stats: Record<string, number> }>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const itemId of Object.values(hero.equipped ?? {})) {
    const item = inventory.find((i) => i.itemId === itemId);
    if (item?.stats) {
      for (const [key, val] of Object.entries(item.stats)) {
        result[key] = (result[key] ?? 0) + val;
      }
    }
  }
  return result;
}

export function HomePage() {
  const { state: meState, logout, refresh: refreshMe } = useMe();
  const hero = useHero();
  const onboarding = useOnboarding();
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

  const handleChoosePath = useCallback(
    (path: OnboardingPath) => {
      void onboarding.choosePath(path);
    },
    [onboarding],
  );

  const handleIntroComplete = useCallback(() => {
    void onboarding.completeIntro();
  }, [onboarding]);

  useEffect(() => {
    if (isAuthenticated) setShowAuth(false);
  }, [isAuthenticated]);

  // Equipped stats für MatchPage berechnen
  const equippedStats = useMemo(() => {
    if (hero.state.status !== "ready") return {};
    return sumEquippedStats(hero.state.hero, hero.state.inventory);
  }, [hero.state]);

  // Nach Match-Ende (XP + Level-Up verrechnet) Held neu laden
  const handleMatchResult = useCallback(() => {
    hero.refresh();
  }, [hero]);

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

  const showOnboarding =
    onboarding.state.status !== "loading" &&
    onboarding.state.status !== "complete";

  if (showOnboarding) {
    return (
      <div className="app-shell">
        <TopBar
          meState={meState}
          hero={hero.state.hero}
          walletAddress={undefined}
          onLogout={() => void logout()}
        />
        <div className="app-body">
          {onboarding.state.status === "choice" && (
            <OnboardingChoice onChoose={handleChoosePath} />
          )}
          {onboarding.state.status === "intro" && onboarding.state.path === "casual" && (
            <NeulingIntro onComplete={handleIntroComplete} />
          )}
          {onboarding.state.status === "intro" && onboarding.state.path === "expert" && (
            <ExperteIntro onComplete={handleIntroComplete} />
          )}
        </div>
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
          equippedStats={equippedStats}
          onMatchResult={handleMatchResult}
        />
      </div>
      <DebugConsole />
    </div>
  );
}