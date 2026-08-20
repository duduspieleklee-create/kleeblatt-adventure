import { useEffect, useRef } from "react";
import { createGame } from "../game/createGame";
import { gameBridge } from "@kleeblatt/shared";

export function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.info("[GamePage] creating Phaser game");
    const game = createGame(container);

    game.events.on("shutdown", () => {
      console.warn("[GamePage] Phaser game shutdown");
    });

    return () => {
      // Pause the game via bridge before destroying
      gameBridge.emit("pause");
      game.destroy(true);
    };
  }, []);

  return (
    <div className="game-container">
      <div ref={containerRef} />
    </div>
  );
}
