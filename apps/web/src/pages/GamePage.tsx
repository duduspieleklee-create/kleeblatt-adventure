import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { createGame } from "../game/createGame";
import { gameBridge } from "@kleeblatt/shared";
import { ShortcutRail } from "../components/ShortcutRail";

export function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Phaser.Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.info("[GamePage] creating Phaser game");
    const g = createGame(container);
    setGame(g);

    g.events.on("shutdown", () => {
      console.warn("[GamePage] Phaser game shutdown");
    });

    return () => {
      // Pause the game via bridge before destroying
      gameBridge.emit("pause");
      g.destroy(true);
      setGame(null);
    };
  }, []);

  return (
    <div className="game-container">
      <div ref={containerRef} />
      <ShortcutRail game={game} />
    </div>
  );
}
