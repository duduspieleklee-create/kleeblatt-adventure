import { useEffect, useRef, useState } from "react";
import { createGame } from "../game/createGame";
import { gameBridge } from "@kleeblatt/shared";

export function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.info("[GamePage] creating Phaser game");
    const game = createGame(container);

    // Listen for scene:ready from the engine
    const onSceneReady = (payload: unknown) => {
      const scene = (payload as { scene?: string }).scene;
      console.info("[GamePage] scene:ready", scene);
      setReady(true);
    };
    gameBridge.on("scene:ready", onSceneReady);

    game.events.on("shutdown", () => {
      console.warn("[GamePage] Phaser game shutdown");
    });

    return () => {
      // Pause the game via bridge before destroying
      gameBridge.emit("pause");
      gameBridge.off("scene:ready", onSceneReady);
      game.destroy(true);
      setReady(false);
    };
  }, []);

  return (
    <div className="game-container">
      <div ref={containerRef} />
      {!ready && (
        <div className="game-loading-overlay">
          <p>Loading game…</p>
        </div>
      )}
    </div>
  );
}
