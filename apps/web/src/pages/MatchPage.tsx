import InventoryScreen from "../components/InventoryScreen";
import { ShortcutRail } from "../components/ShortcutRail";
import { useCallback, useEffect, useRef, useState } from "react";
import { gameBridge } from "@kleeblatt/shared";
import { createGame } from "../game/createGame";
import type { HeroClass } from "@kleeblatt/shared";
import { GameHud } from "../components/GameHud";
import { submitMatchResult } from "../lib/api";
import { useInventoryPersistence } from "../hooks/useInventoryPersistence";
import { useMe } from "../hooks/useMe";
import { setSessionPlayerName } from "../game/multiplayer/sessionName";
import type Phaser from "phaser";

interface MatchPageProps {
  heroClass?: HeroClass;
  heroLevel?: number;
  equippedStats?: Record<string, number>;
  /** Wird nach POST /match/result aufgerufen (z.B. Hero-Daten neu laden). */
  onMatchResult?: (result: { xpGained: number; leveledUp: boolean; newLevel: number }) => void;
}

export function MatchPage({ heroClass, heroLevel, equippedStats, onMatchResult }: MatchPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [matchActive, setMatchActive] = useState(true);
  const [showInventory, setShowInventory] = useState(false);
  const [game, setGame] = useState<Phaser.Game | null>(null);

  // Load stacks from API/localStorage, hydrate Phaser, debounce-save on inventory:updated
  useInventoryPersistence(true);

  // Inject the authenticated display name so the multiplayer layer stamps it
  // on outgoing chat (Guest-xxxx fallback applies if anonymous). Best-effort:
  // the Phaser layer reads this via getSessionPlayerName().
  const { state: meState } = useMe();
  useEffect(() => {
    if (meState.status === "authenticated") {
      const name = meState.me.displayName ?? meState.me.email;
      if (name) setSessionPlayerName(name);
    }
  }, [meState]);

  const toggleInventory = () => {
    setShowInventory(!showInventory);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.info("[MatchPage] creating Phaser game");
    const game = createGame(container);
    setGame(game);

    game.events.on("ready", () => {
      console.info("[MatchPage] Phaser game ready");
      setMatchActive(true);
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
      setGame(null);
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

  useEffect(() => {
    handleStart();
  }, [handleStart]);

  return (
    <div className="game-container">
      {showInventory ? (
        <div className="inventory-overlay">
          <button type="button" onClick={toggleInventory} className="close-button">
            Schließen
          </button>
          <InventoryScreen />
        </div>
      ) : null}
      {matchActive && (
        <div className="game-overlay-top">
          <button type="button" onClick={handleExit}>
            Verlassen
          </button>
          <button type="button" onClick={toggleInventory}>
            Inventar
          </button>
        </div>
      )}
      <div ref={containerRef} />
      {matchActive && <GameHud />}
      {matchActive && <ShortcutRail game={game} />}
    </div>
  );
}
