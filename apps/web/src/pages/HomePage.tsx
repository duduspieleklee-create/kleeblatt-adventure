import { useCallback } from "react";
import { useHealth } from "../hooks/useHealth";
import { useMe } from "../hooks/useMe";
import { useHero } from "../hooks/useHero";
import { WalletCard } from "../components/WalletCard";
import { StatusCard } from "../components/StatusCard";
import { AuthCard } from "../components/AuthCard";
import { HeroSetupCard } from "../components/HeroSetupCard";
import { HeroDashboardCard } from "../components/HeroDashboardCard";
import { NextStepsCard } from "../components/NextStepsCard";
import { MatchPage } from "./MatchPage";

const showDevLogin = import.meta.env.DEV;

export function HomePage() {
  const health = useHealth();
  const { state: meState, logout } = useMe();
  const hero = useHero();

  const handleCreated = useCallback(() => {
    void hero.refresh();
  }, [hero]);

  return (
    <div className="app">
      <header>
        <h1>Kleeblatt Adventure</h1>
        <p className="tag">Prototyp – P9 Wallet</p>
      </header>
      <main>
        <StatusCard health={health} hero={hero.state.status === "ready" ? hero.state.hero : null} />
        <AuthCard state={meState} onLogout={() => void logout()} showDevLogin={showDevLogin} />

        {meState.status === "authenticated" &&
          (hero.state.status === "loading" ? (
            <section className="card">
              <p className="muted">Lade Held …</p>
            </section>
          ) : hero.state.status === "error" ? (
            <section className="card">
              <p className="error">{hero.state.message}</p>
            </section>
          ) : hero.state.status === "none" ? (
            <HeroSetupCard onCreated={handleCreated} />
          ) : (
            <>
              <HeroDashboardCard
                hero={hero.state.hero}
                inventory={hero.state.inventory}
                onChange={hero.refresh}
              />
              <WalletCard />
              <MatchPage
                heroClass={hero.state.hero.class}
                heroLevel={hero.state.hero.level}
                equippedStats={{}}
              />
            </>
          ))}

        <NextStepsCard />
      </main>
    </div>
  );
}
