import { useEffect, useRef, useState } from "react";
import { gameBridge, type GameBridgeEvents } from "@kleeblatt/shared";

interface LevelState {
  level: number;
  xp: number;
  xpToNext: number;
}

const DEFAULT_STATE: LevelState = { level: 1, xp: 0, xpToNext: 100 };
const LEVEL_UP_DURATION_MS = 1600;

/**
 * React HUD – Level + XP-Bar (P5, Workboard #51).
 *
 * Hört auf gameBridge "player:level"-Events (MatchScene) und zeigt
 * Level-Anzeige, XP-Bar (current/xpToNext) und einen Level-Up-Effekt.
 */
export function GameHud() {
  const [state, setState] = useState<LevelState>(DEFAULT_STATE);
  const [levelUp, setLevelUp] = useState(false);
  const prevLevel = useRef(state.level);
  const levelUpTimer = useRef<number | null>(null);

  useEffect(() => {
    const onLevel = (payload: GameBridgeEvents["player:level"]) => {
      if (payload.level > prevLevel.current) {
        prevLevel.current = payload.level;
        setLevelUp(true);
        if (levelUpTimer.current !== null) window.clearTimeout(levelUpTimer.current);
        levelUpTimer.current = window.setTimeout(() => setLevelUp(false), LEVEL_UP_DURATION_MS);
      }
      setState({ level: payload.level, xp: payload.xp, xpToNext: payload.xpToNext });
    };

    gameBridge.on("player:level", onLevel);
    return () => {
      gameBridge.off("player:level", onLevel);
      if (levelUpTimer.current !== null) window.clearTimeout(levelUpTimer.current);
    };
  }, []);

  const pct =
    state.xpToNext > 0 ? Math.min(100, Math.max(0, (state.xp / state.xpToNext) * 100)) : 0;

  return (
    <div className={`game-hud${levelUp ? " game-hud--levelup" : ""}`}>
      {levelUp && <div className="game-hud-levelup-badge">LEVEL UP!</div>}
      <div className="game-hud-level">Lv. {state.level}</div>
      <div
        className="game-hud-xp-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div className="game-hud-xp-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="game-hud-xp-text">
        {state.xp} / {state.xpToNext} XP
      </div>
    </div>
  );
}
