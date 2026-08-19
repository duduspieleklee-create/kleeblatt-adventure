import { useEffect, useRef } from "react";
import { createGame } from "../game/createGame";

interface MatchPageProps {
  heroClass?: string;
  heroLevel?: number;
  equippedStats?: Record<string, number>;
  /** Kept for future integration; the kleeblock game currently runs its own standalone systems. */
  onMatchResult?: (result: { xpGained: number; leveledUp: boolean; newLevel: number }) => void;
}

export function MatchPage({ onMatchResult }: MatchPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.info("[MatchPage] creating Phaser game");
    const game = createGame(container);

    game.events.on("ready", () => {
      console.info("[MatchPage] Phaser game ready");
    });

    game.events.on("shutdown", () => {
      console.warn("[MatchPage] Phaser game shutdown");
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  // Future integration: bridge the kleeblock game events to onMatchResult.
  // The current game is standalone; the React host is intentionally minimal.
  void onMatchResult;

  return (
    <div className="game-container">
      <div ref={containerRef} />
    </div>
  );
}
