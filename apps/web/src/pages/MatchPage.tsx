import { useEffect, useRef } from "react";
import { createGame } from "../game/createGame";
import { gameBridge } from "@kleeblatt/shared";
import type { HeroClass } from "@kleeblatt/shared";

interface MatchPageProps {
  heroClass?: HeroClass;
  heroLevel?: number;
  equippedStats?: Record<string, number>;
}

export function MatchPage({ heroClass, heroLevel, equippedStats }: MatchPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const game = createGame(container);

    game.events.on("ready", () => {
      gameBridge.emit("match:start", {
        heroClass: heroClass ?? "melee",
        level: heroLevel ?? 1,
        equippedStats: equippedStats ?? {},
      });
    });

    return () => {
      game.destroy(true);
    };
  }, [heroClass, heroLevel, equippedStats]);

  return (
    <section className="card">
      <h2>Abenteuer</h2>
      <div className="game-container" ref={containerRef} />
    </section>
  );
}
