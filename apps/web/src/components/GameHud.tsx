import { useEffect, useRef, useState } from "react";
import { gameBridge } from "../lib/gameBridge";
import { PhaserEvents } from "../game/core/GameEvents";

interface LevelState {
  level: number;
  xp: number;
  xpToNext: number;
}

interface ResourceState {
  current: number;
  max: number;
}

interface CombatLogEntry {
  id: number;
  message: string;
  type: "hit" | "death" | "loot" | "heal" | "info";
  timestamp: number;
}

const DEFAULT_LEVEL: LevelState = { level: 1, xp: 0, xpToNext: 100 };
const DEFAULT_HP: ResourceState = { current: 120, max: 120 };
const DEFAULT_MANA: ResourceState = { current: 80, max: 80 };
const DEFAULT_STAMINA: ResourceState = { current: 100, max: 100 };
const LEVEL_UP_DURATION_MS = 1600;
const COMBAT_LOG_MAX = 50;
const LOG_ENTRY_TTL_MS = 30000;

interface BarProps {
  label: string;
  current: number;
  max: number;
  className: string;
  /** Base name of the bar sprite (redbar/bluebar/greenbar) – frame 00..N. */
  sprite: string;
}

/** Number of pixel-art bar frames per sprite (assets/ui/{sprite}_NN.png). */
const BAR_SPRITE_FRAMES: Record<string, number> = {
  redbar: 7,
  bluebar: 6,
  greenbar: 7,
};

function StatBar({ label, current, max, className, sprite }: BarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  // Map 0..100% → frame index 0..(frames-1) (00 = empty, last = full)
  const frames = BAR_SPRITE_FRAMES[sprite] ?? 7;
  const frame = Math.min(frames - 1, Math.round((pct / 100) * (frames - 1)));
  const frameLabel = String(frame).padStart(2, "0");
  return (
    <div className={`game-hud-bar ${className}`}>
      <span className="game-hud-bar-label">{label}</span>
      <div className="game-hud-bar-track">
        <img
          className="game-hud-bar-sprite"
          src={`/assets/ui/${sprite}_${frameLabel}.png`}
          alt={`${label} ${Math.round(pct)}%`}
          draggable={false}
        />
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
  /** Tool icon base name from assets/ui (e.g. "sword"). */
  icon?: string;
}

function SkillSlot({ slot, readyAt, icon }: SkillSlotProps) {
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
      {icon ? (
        <img
          className="game-hud-skill-icon"
          src={`/assets/ui/${icon}.png`}
          alt={slot}
          draggable={false}
        />
      ) : (
        <span className="game-hud-skill-key">{slot}</span>
      )}
      {remainingMs > 0 && <span className="game-hud-skill-cd">{seconds}s</span>}
    </div>
  );
}

function DamagePopup({
  value,
  x,
  y,
  color,
}: {
  value: number;
  x: number;
  y: number;
  color: string;
}) {
  const [opacity, setOpacity] = useState(1);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const anim = setInterval(() => {
        setOpacity((o) => {
          if (o <= 0.1) {
            clearInterval(anim);
            return 0;
          }
          return o - 0.05;
        });
        setOffsetY((o) => o - 1);
      }, 30);
      return () => clearInterval(anim);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + offsetY,
        color,
        fontSize: 18,
        fontWeight: "bold",
        opacity,
        pointerEvents: "none",
        textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
        transition: "none",
        zIndex: 100,
      }}
    >
      {value > 0 ? `-${value}` : `+${Math.abs(value)}`}
    </div>
  );
}

function CombatLog({ entries }: { entries: CombatLogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const typeColors: Record<string, string> = {
    hit: "#ff6b6b",
    death: "#ff4444",
    loot: "#fbbf24",
    heal: "#4ade80",
    info: "#8fa88f",
  };

  const typeIcons: Record<string, string> = {
    hit: "⚔️",
    death: "💀",
    loot: "🎁",
    heal: "💚",
    info: "ℹ️",
  };

  return (
    <div
      ref={scrollRef}
      style={{
        height: 120,
        overflowY: "auto",
        background: "rgba(0, 0, 0, 0.6)",
        borderRadius: 6,
        padding: 6,
        fontSize: 11,
        fontFamily: "monospace",
      }}
    >
      {entries.length === 0 ? (
        <div style={{ color: "#555", textAlign: "center", padding: 10 }}>
          Kampf-Log erscheint hier...
        </div>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              color: typeColors[entry.type] || "#8fa88f",
              marginBottom: 2,
              opacity: Math.max(0.4, 1 - (Date.now() - entry.timestamp) / LOG_ENTRY_TTL_MS),
            }}
          >
            <span>{typeIcons[entry.type] || ""} </span>
            <span>{entry.message}</span>
          </div>
        ))
      )}
    </div>
  );
}

export function GameHud() {
  const [levelState, setLevelState] = useState<LevelState>(DEFAULT_LEVEL);
  const [hp, setHp] = useState<ResourceState>(DEFAULT_HP);
  const [mana, setMana] = useState<ResourceState>(DEFAULT_MANA);
  const [stamina, setStamina] = useState<ResourceState>(DEFAULT_STAMINA);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [levelUp, setLevelUp] = useState(false);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [damagePopups, setDamagePopups] = useState<
    Array<{ id: number; value: number; x: number; y: number; color: string }>
  >([]);
  const [gold, setGold] = useState(0);
  /** Expression icon base name from assets/ui/expression_*.png */
  const [expression, setExpression] = useState("chat");
  const expressionTimer = useRef<number | null>(null);
  const prevLevel = useRef(levelState.level);
  const levelUpTimer = useRef<number | null>(null);
  const logIdCounter = useRef(0);
  const popupIdCounter = useRef(0);

  useEffect(() => {
    const onStats = (data: {
      hp?: number;
      maxHp?: number;
      mana?: number;
      maxMana?: number;
      stamina?: number;
      maxStamina?: number;
      xp?: number;
      level?: number;
      gold?: number;
    }) => {
      if (data.hp !== undefined && data.maxHp !== undefined) {
        setHp({ current: data.hp, max: data.maxHp });
      }
      if (data.mana !== undefined && data.maxMana !== undefined) {
        setMana({ current: data.mana, max: data.maxMana });
      }
      if (data.stamina !== undefined && data.maxStamina !== undefined) {
        setStamina({ current: data.stamina, max: data.maxStamina });
      }
      if (data.xp !== undefined && data.level !== undefined) {
        setLevelState((prev) => ({
          ...prev,
          xp: data.xp!,
          level: data.level!,
          xpToNext: (data.level ?? prev.level) * 100,
        }));
      }
      if (data.gold !== undefined) {
        setGold(data.gold);
      }
    };

    const onCombatHit = (data: {
      attackerId?: string;
      targetId?: string;
      damage?: number;
      attacker?: string;
      target?: string;
    }) => {
      const dmg = data.damage ?? 0;
      const attacker = data.attackerId || data.attacker || "Unknown";
      const target = data.targetId || data.target || "Unknown";

      setCombatLog((prev) => [
        ...prev.slice(-(COMBAT_LOG_MAX - 1)),
        {
          id: logIdCounter.current++,
          message: `${attacker} trifft ${target} für ${dmg} Schaden`,
          type: "hit",
          timestamp: Date.now(),
        },
      ]);

      setDamagePopups((prev) => [
        ...prev,
        {
          id: popupIdCounter.current++,
          value: dmg,
          x: 100 + Math.random() * 200,
          y: 50 + Math.random() * 100,
          color: "#ff6b6b",
        },
      ]);
    };

    const onCombatDeath = (data: { targetId?: string; name?: string }) => {
      const name = data.targetId || data.name || "Gegner";
      setCombatLog((prev) => [
        ...prev.slice(-(COMBAT_LOG_MAX - 1)),
        {
          id: logIdCounter.current++,
          message: `${name} besiegt!`,
          type: "death",
          timestamp: Date.now(),
        },
      ]);
    };

    const onLootDropped = (data: { item?: string; amount?: number; gold?: number }) => {
      const parts: string[] = [];
      if (data.item) parts.push(`${data.amount ?? 1}x ${data.item}`);
      if (data.gold) parts.push(`${data.gold} Gold`);
      if (parts.length > 0) {
        setCombatLog((prev) => [
          ...prev.slice(-(COMBAT_LOG_MAX - 1)),
          {
            id: logIdCounter.current++,
            message: `Beute: ${parts.join(", ")}`,
            type: "loot",
            timestamp: Date.now(),
          },
        ]);
      }
    };

    const onHpChanged = (data: { hp?: number; maxHp?: number }) => {
      if (data.hp !== undefined && data.maxHp !== undefined) {
        setHp({ current: data.hp, max: data.maxHp });
      }
    };

    const onXpChanged = (data: { xp?: number; level?: number }) => {
      if (data.level !== undefined && data.xp !== undefined) {
        if (data.level > prevLevel.current) {
          prevLevel.current = data.level;
          setLevelUp(true);
          if (levelUpTimer.current !== null) window.clearTimeout(levelUpTimer.current);
          levelUpTimer.current = window.setTimeout(() => setLevelUp(false), LEVEL_UP_DURATION_MS);
          setCombatLog((prev) => [
            ...prev.slice(-(COMBAT_LOG_MAX - 1)),
            {
              id: logIdCounter.current++,
              message: `Level Up! Jetzt Level ${data.level}!`,
              type: "info",
              timestamp: Date.now(),
            },
          ]);
        }
        setLevelState((prev) => ({
          ...prev,
          xp: data.xp!,
          level: data.level!,
          xpToNext: data.level! * 100,
        }));
      }
    };

    const onSkillReady = (skillId: string) => {
      setCooldowns((prev) => {
        const next = { ...prev };
        delete next[skillId];
        return next;
      });
    };

    /** Flash a player expression icon for ~1.6s, then back to "chat". */
    const flashExpression = (name: string) => {
      setExpression(name);
      if (expressionTimer.current !== null) window.clearTimeout(expressionTimer.current);
      expressionTimer.current = window.setTimeout(() => setExpression("chat"), 1600);
    };

    gameBridge.on(PhaserEvents.PLAYER_STATS_UPDATED, onStats);
    gameBridge.on(PhaserEvents.COMBAT_HIT, (data: { attackerId?: string }) => {
      onCombatHit(data);
      // Show "attack" expression when the player lands a hit
      if (data.attackerId === "player") flashExpression("attack");
    });
    gameBridge.on(PhaserEvents.COMBAT_DEATH, (data: { targetId?: string; name?: string }) => {
      onCombatDeath(data);
      flashExpression("alerted");
    });
    gameBridge.on(
      PhaserEvents.LOOT_DROPPED,
      (data: { item?: string; amount?: number; gold?: number }) => {
        onLootDropped(data);
        flashExpression("love");
      },
    );
    gameBridge.on(PhaserEvents.PLAYER_HP_CHANGED, onHpChanged);
    gameBridge.on(PhaserEvents.PLAYER_XP_CHANGED, onXpChanged);
    gameBridge.on(PhaserEvents.SKILL_READY, onSkillReady);
  }, []);

  const xpPct =
    levelState.xpToNext > 0
      ? Math.min(100, Math.max(0, (levelState.xp / levelState.xpToNext) * 100))
      : 0;

  const cleanedPopups = damagePopups.filter((p) => {
    const age = Date.now() - p.id * 1000;
    return age < 2000;
  });

  return (
    <div
      className={`game-hud${levelUp ? " game-hud--levelup" : ""}`}
      style={{ position: "relative" }}
    >
      {cleanedPopups.map((popup) => (
        <DamagePopup
          key={popup.id}
          value={popup.value}
          x={popup.x}
          y={popup.y}
          color={popup.color}
        />
      ))}

      {levelUp && <div className="game-hud-levelup-badge">LEVEL UP!</div>}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div
          className="game-hud-level"
          style={{ fontSize: 16, fontWeight: "bold", color: "#fbbf24" }}
        >
          Lv. {levelState.level}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <img
            className="game-hud-expression"
            src={`/assets/ui/expression_${expression}.png`}
            alt="Player expression"
            title={expression}
            draggable={false}
          />
          <div style={{ fontSize: 14, color: "#fbbf24" }}>💰 {gold} Gold</div>
        </div>
      </div>

      <div
        className="game-hud-xp-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(xpPct)}
        style={{
          height: 6,
          background: "rgba(0,0,0,0.4)",
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: 4,
        }}
      >
        <div
          className="game-hud-xp-fill"
          style={{
            width: `${xpPct}%`,
            height: "100%",
            background: "linear-gradient(90deg, #4ade80, #22c55e)",
            borderRadius: 3,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div className="game-hud-xp-text" style={{ fontSize: 11, color: "#8fa88f", marginBottom: 8 }}>
        {levelState.xp} / {levelState.xpToNext} XP
      </div>

      <StatBar
        label="HP"
        current={hp.current}
        max={hp.max}
        className="game-hud-bar--hp"
        sprite="redbar"
      />
      <StatBar
        label="Mana"
        current={mana.current}
        max={mana.max}
        className="game-hud-bar--mana"
        sprite="bluebar"
      />
      <StatBar
        label="Stamina"
        current={stamina.current}
        max={stamina.max}
        className="game-hud-bar--stamina"
        sprite="greenbar"
      />

      <div className="game-hud-skills" style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <SkillSlot slot="Q" readyAt={cooldowns["slash"]} icon="sword" />
        <SkillSlot slot="E" readyAt={cooldowns["fireball"]} icon="rod" />
        <SkillSlot slot="A" readyAt={cooldowns["heal"]} icon="plant" />
        <SkillSlot slot="J" readyAt={cooldowns["power_strike"]} icon="hammer" />
      </div>

      <div style={{ marginTop: 8 }}>
        <CombatLog entries={combatLog} />
      </div>
    </div>
  );
}
