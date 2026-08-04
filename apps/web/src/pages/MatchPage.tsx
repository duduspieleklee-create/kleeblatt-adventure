import InventoryScreen from "../components/InventoryScreen";
import { useCallback, useEffect, useRef, useState } from "react";
import { gameBridge } from "@kleeblatt/shared";
import { createGame } from "../game/createGame";
import type { HeroClass } from "@kleeblatt/shared";
import { MobileControls } from "../components/MobileControls";
import { submitMatchResult } from "../lib/api";

interface MatchPageProps {
  heroClass?: HeroClass;
  heroLevel?: number;
  equippedStats?: Record<string, number>;
  /** Wird nach POST /match/result aufgerufen (z.B. Hero-Daten neu laden). */
  onMatchResult?: (result: { xpGained: number; leveledUp: boolean; newLevel: number }) => void;
}

export function MatchPage({ heroClass, heroLevel, equippedStats, onMatchResult }: MatchPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [matchActive, setMatchActive] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  const toggleInventory = () => {
    setShowInventory(!showInventory);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.info("[MatchPage] creating Phaser game");
    const game = createGame(container);

    game.events.on("ready", () => {
      console.info("[MatchPage] Phaser game ready");
    });

    game.events.on("shutdown", () => {
      console.error("[MatchPage] Phaser game shutdown (crashed?)");
    });

    const onStarted = () => setMatchActive(true);
    gameBridge.on("match:started", onStarted);

    const onEnded = (payload: { matchId: string; enemiesKilled: number; chestsOpened: number }) => {
      setMatchActive(false);
      void submitMatchResult({
        matchId: payload.matchId,
        enemiesKilled: payload.enemiesKilled,
        chestsOpened: payload.chestsOpened,
      }).then((res) => {
        if (res.ok) {
          onMatchResult?.({
            xpGained: res.data.xpGained,
            leveledUp: res.data.leveledUp,
            newLevel: res.data.newLevel,
          });
        }
      });
    };
    gameBridge.on("match:ended", onEnded);

    return () => {
      gameBridge.off("match:started", onStarted);
      gameBridge.off("match:ended", onEnded);
      game.destroy(true);
    };
  }, [onMatchResult]);

  const handleStart = useCallback(() => {
    gameBridge.emit("match:start", {
      heroClass: heroClass ?? "warrior",
      level: heroLevel ?? 1,
      equippedStats: equippedStats ?? {},
    });
  }, [heroClass, heroLevel, equippedStats]);

  const handleExit = useCallback(() => {
    gameBridge.emit("match:exit", {});
  }, []);

  return (
    <div className="game-container">
      {showInventory ? (
        <div className="inventory-overlay">
          <button type="button" onClick={toggleInventory} className="close-button">
            Schließen
          </button>
          <InventoryScreen />
        </div>
      ) : (
        !matchActive ? (
          <div className="game-overlay">
            <p>Wähle deinen Weg – die Map erwartet dich.</p>
            <button type="button" className="primary" onClick={handleStart}>
              Abenteuer starten ↗
            </button>
          </div>
        ) : (
          <div className="game-overlay-top">
            <p>Match aktiv – WASD zum Bewegen, Maus zum Zielen.</p>
            <button type="button" onClick={handleExit}>
              Verlassen
            </button>
            <button type="button" onClick={toggleInventory}>
              Inventar
            </button>
          </div>
        )
      )}
      <div ref={containerRef} />
      <MobileControls />
    </div>
  );
}