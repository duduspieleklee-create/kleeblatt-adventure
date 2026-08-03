import { useCallback } from "react";
import type { HeroResponse } from "@kleeblatt/shared";
import { StatusCard } from "../components/StatusCard";
import { NextStepsCard } from "../components/NextStepsCard";
import { AuthCard } from "../components/AuthCard";
import { HeroSetupCard } from "../components/HeroSetupCard";
import { HeroDashboardCard } from "../components/HeroDashboardCard";
import { MatchPage } from "./MatchPage";
import { useHealth } from "../hooks/useHealth";
import { useMe } from "../hooks/useMe";
import { useHero } from "../hooks/useHero";

const showDevLogin = import.meta.env.DEV;

export function HomePage() {
  const health = useHealth();
  const { state: meState, logout } = useMe();
  const hero = useHero();

  const handleCreated = useCallback(
    (_hero: HeroResponse) => {
      hero.refresh();
    },
    [hero],
  );

  return (
    <div className="app">
      <header>
        <h1>Kleeblatt Adventure</h1>
        <p className="tag">Prototyp – P2 Held &amp; Starter-Gear</p>
      </header>
      <main>
        <StatusCard health={health} />
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
              <MatchPage />
            </>
          ))}

        <NextStepsCard />
      </main>
    </div>
  );
}
