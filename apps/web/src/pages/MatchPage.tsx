import { useCallback, useEffect, useRef, useState } from "react";
import { gameBridge } from "@kleeblatt/shared";
import { createGame } from "../game/createGame";
import { MobileControls } from "../components/MobileControls";
import { submitMatchResult } from "../lib/api";

interface MatchPageProps {
  heroClass: string;
  heroLevel: number;
  equippedStats: Record<string, number>;
  /** Wird nach POST /match/result aufgerufen (z.B. Hero-Daten neu laden). */
  onMatchResult?: (result: { xpGained: number; leveledUp: boolean; newLevel: number }) => void;
}

/**
 * P4-1/P4-3/P4-4 + P6: React-Page mit Phaser-Container.
 *
 * - "Abenteuer starten" → match:start via gameBridge mit Hero-Daten
 * - "Verlassen" → match:exit → Phaser emittiert match:ended (Kills/Chests)
 * - match:ended → POST /match/result (XP + Level-Up server-authoritativ)
 * - MobileControls für Touch-Geräte
 */
export function MatchPage({ heroClass, heroLevel, equippedStats, onMatchResult }: MatchPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [matchActive, setMatchActive] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const game = createGame(container);

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
      heroClass,
      level: heroLevel,
      equippedStats,
    });
  }, [heroClass, heroLevel, equippedStats]);

  const handleExit = useCallback(() => {
    gameBridge.emit("match:exit", {});
  }, []);

  return (
    <section className="card">
      <h2>Abenteuer</h2>
      {!matchActive ? (
        <div>
          <p className="muted">Wähle deinen Weg – die Map erwartet dich.</p>
          <button type="button" className="primary" onClick={handleStart}>
            Abenteuer starten ↗
          </button>
        </div>
      ) : (
        <div>
          <p className="muted">Match aktiv – WASD zum Bewegen, Maus zum Zielen.</p>
          <button type="button" onClick={handleExit}>
            Verlassen
          </button>
        </div>
      )}
      <div className="game-container" ref={containerRef} />
      <MobileControls />
    </section>
  );
}
