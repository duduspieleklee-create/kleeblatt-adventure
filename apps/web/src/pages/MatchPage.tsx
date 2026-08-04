import { useEffect, useRef } from "react";
import { createGame } from "../game/createGame";
import type { HeroClass } from "@kleeblatt/shared";

interface MatchPageProps {
  heroClass?: HeroClass;
  heroLevel?: number;
  equippedStats?: Record<string, number>;
}

export function MatchPage({ heroClass: _heroClass, heroLevel: _heroLevel, equippedStats: _equippedStats }: MatchPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const game = createGame(container);
    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <section className="card">
      <h2>Abenteuer</h2>
      <p className="muted">
        Match-Shell (Phaser-Container) – Scenes folgen in den nächsten Karten.
      </p>
      <div className="game-container" ref={containerRef} />
    </section>
  );
}
