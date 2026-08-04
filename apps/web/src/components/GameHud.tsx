import { useEffect, useRef, useState } from "react";
import { gameBridge, type GameBridgeEvents } from "@kleeblatt/shared";

interface LevelState {
  level: number;
  xp: number;
  xpToNext: number;
}

interface ResourceState {
  current: number;
  max: number;
}

const DEFAULT_LEVEL: LevelState = { level: 1, xp: 0, xpToNext: 100 };
const DEFAULT_HP: ResourceState = { current: 120, max: 120 };
const DEFAULT_MANA: ResourceState = { current: 80, max: 80 };
const DEFAULT_STAMINA: ResourceState = { current: 100, max: 100 };
const LEVEL_UP_DURATION_MS = 1600;

interface BarProps {
  label: string;
  current: number;
  max: number;
  className: string;
}

/** Horizontale Stat-Bar (HP/Mana/Stamina). */
function StatBar({ label, current, max, className }: BarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  return (
    <div className={`game-hud-bar ${className}`}>
      <span className="game-hud-bar-label">{label}</span>
      <div className="game-hud-bar-track">
        <div className="game-hud-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="game-hud-bar-value">
        {Math.round(current)}/{Math.round(max)}
      </span>
    </div>
  );
}

interface SkillSlotProps {
  slot: string;
  readyAt?: number;
}

/** Skill-Slot (Q/E) mit Cooldown-Overlay über skill:cooldown-Events. */
function SkillSlot({ slot, readyAt }: SkillSlotProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (readyAt === undefined) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 100);
    return () => window.clearInterval(interval);
  }, [readyAt]);

  const remainingMs = readyAt === undefined ? 0 : Math.max(0, readyAt - now);
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div className={`game-hud-skill${remainingMs > 0 ? " game-hud-skill--cooldown" : ""}`}>
      <span className="game-hud-skill-key">{slot}</span>
      {remainingMs > 0 && <span className="game-hud-skill-cd">{seconds}s</span>}
    </div>
  );
}

/**
 * React HUD – Level + XP-Bar (#51) und HP-/Resource-Bars + Skill-Slots (#49).
 *
 * Hört auf gameBridge-Events (MatchScene → React):
 * - "player:level"   → Level-Anzeige, XP-Bar, Level-Up-Effekt
 * - "player:hp"      → HP-Bar (current/max)
 * - "player:resource"→ Mana-/Stamina-Bar
 * - "skill:cooldown" → Cooldown-Overlay auf Q/E-Slots
 */
export function GameHud() {
  const [levelState, setLevelState] = useState<LevelState>(DEFAULT_LEVEL);
  const [hp, setHp] = useState<ResourceState>(DEFAULT_HP);
  const [mana, setMana] = useState<ResourceState>(DEFAULT_MANA);
  const [stamina, setStamina] = useState<ResourceState>(DEFAULT_STAMINA);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [levelUp, setLevelUp] = useState(false);
  const prevLevel = useRef(levelState.level);
  const levelUpTimer = useRef<number | null>(null);

  useEffect(() => {
    const onLevel = (payload: GameBridgeEvents["player:level"]) => {
      if (payload.level > prevLevel.current) {
        prevLevel.current = payload.level;
        setLevelUp(true);
        if (levelUpTimer.current !== null) window.clearTimeout(levelUpTimer.current);
        levelUpTimer.current = window.setTimeout(() => setLevelUp(false), LEVEL_UP_DURATION_MS);
      }
      setLevelState({ level: payload.level, xp: payload.xp, xpToNext: payload.xpToNext });
    };
    const onHp = (payload: GameBridgeEvents["player:hp"]) => {
      setHp({ current: payload.current, max: payload.max });
    };
    const onResource = (payload: GameBridgeEvents["player:resource"]) => {
      const value = { current: payload.current, max: payload.max };
      if (payload.type === "mana") setMana(value);
      else setStamina(value);
    };
    const onCooldown = (payload: GameBridgeEvents["skill:cooldown"]) => {
      setCooldowns((prev) => ({ ...prev, [payload.skillId]: payload.readyAt }));
    };

    gameBridge.on("player:level", onLevel);
    gameBridge.on("player:hp", onHp);
    gameBridge.on("player:resource", onResource);
    gameBridge.on("skill:cooldown", onCooldown);
    return () => {
      gameBridge.off("player:level", onLevel);
      gameBridge.off("player:hp", onHp);
      gameBridge.off("player:resource", onResource);
      gameBridge.off("skill:cooldown", onCooldown);
      if (levelUpTimer.current !== null) window.clearTimeout(levelUpTimer.current);
    };
  }, []);

  const xpPct =
    levelState.xpToNext > 0
      ? Math.min(100, Math.max(0, (levelState.xp / levelState.xpToNext) * 100))
      : 0;

  return (
    <div className={`game-hud${levelUp ? " game-hud--levelup" : ""}`}>
      {levelUp && <div className="game-hud-levelup-badge">LEVEL UP!</div>}
      <div className="game-hud-level">Lv. {levelState.level}</div>
      <div
        className="game-hud-xp-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(xpPct)}
      >
        <div className="game-hud-xp-fill" style={{ width: `${xpPct}%` }} />
      </div>
      <div className="game-hud-xp-text">
        {levelState.xp} / {levelState.xpToNext} XP
      </div>
      <StatBar label="HP" current={hp.current} max={hp.max} className="game-hud-bar--hp" />
      <StatBar label="Mana" current={mana.current} max={mana.max} className="game-hud-bar--mana" />
      <StatBar
        label="Stamina"
        current={stamina.current}
        max={stamina.max}
        className="game-hud-bar--stamina"
      />
      <div className="game-hud-skills">
        <SkillSlot slot="Q" readyAt={cooldowns["skill_q"]} />
        <SkillSlot slot="E" readyAt={cooldowns["skill_e"]} />
      </div>
    </div>
  );
}
