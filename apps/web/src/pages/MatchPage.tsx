import { useEffect, useRef } from "react";
import { createGame } from "../game/createGame";

/**
 * P4-1: React-Page mit Phaser-Container.
 * Hostet das Phaser-Game in einem Container-Div; destroyed es beim Unmount.
 */
export function MatchPage() {
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
