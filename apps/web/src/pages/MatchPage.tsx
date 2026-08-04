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

    console.log("[MatchPage] creating Phaser game");
    const game = createGame(container);

    game.events.on("ready", () => {
      console.log("[MatchPage] Phaser game ready");
    });

    game.events.on("shutdown", () => {
      console.error("[MatchPage] Phaser game shutdown (crashed?)");
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div className="game-container" ref={containerRef} />
  );
}