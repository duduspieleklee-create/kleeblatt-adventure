# 19 – Phaser Rule Engine

**Version:** 1.0  
**Stand:** 3. August 2026  
**Status:** Design + TypeScript Contracts

---

## 1. Ziel

Dünne **Combat-/Game-Rules-Schicht** im Client:

- Phaser liefert Input, Overlaps, Positionen
- RuleEngine entscheidet Schaden, CDs, Effekte, Tod
- Ausgabe als **Events**, die Phaser (VFX) und React (HUD) konsumieren

Keine generische Business-Rule-DSL – nur das, was M4-Combat braucht.

Verwandt: [17-mvp-gameplay.md](./17-mvp-gameplay.md), [18-enemy-ai.md](./18-enemy-ai.md).

---

## 2. Datenfluss

```
Input / Enemy-AI
    → Intent
    → RuleEngine.resolve(intent, world, now)
    → RuleEvent[]
    → applyEvents (Phaser sprites, gameBridge HUD)
```

---

## 3. TypeScript-Interfaces

```ts
// packages/shared/src/rules/types.ts  (Vorschlag)

/** Stabile IDs in einer Match-Session (nicht zwingend DB-UUIDs) */
export type EntityId = string;

export type HeroClass = "mage" | "ranged" | "melee";

export type EnemyTypeId = "bruiser" | "runner" | "spitter";

export type SkillId =
  | "dash"
  | "shield_wall"
  | "rapid_fire"
  | "slow_shot"
  | "fireball"
  | "blink";

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

export type EffectKind = "damage_reduction" | "slow";

export interface EffectBase {
  id: string;
  kind: EffectKind;
  expiresAt: number; // performance.now() oder match-ms
}

export interface DamageReductionEffect extends EffectBase {
  kind: "damage_reduction";
  /** 0.35 = 65% weniger Schaden */
  factor: number;
}

export interface SlowEffect extends EffectBase {
  kind: "slow";
  /** 0.4 = 40% der Normalgeschwindigkeit */
  factor: number;
}

export type Effect = DamageReductionEffect | SlowEffect;

// ---------------------------------------------------------------------------
// World snapshot (read model für die Engine)
// ---------------------------------------------------------------------------

export interface CooldownState {
  skillId: SkillId;
  readyAt: number;
}

export interface EntityStats {
  maxHp: number;
  /** Basis-Angriffsschaden (ohne Skill-Tabelle) */
  atk: number;
  speed: number;
  maxMana?: number;
  maxStamina?: number;
}

export interface EntityState {
  id: EntityId;
  kind: "hero" | "enemy";
  class?: HeroClass;
  enemyType?: EnemyTypeId;
  x: number;
  y: number;
  hp: number;
  mana?: number;
  stamina?: number;
  stats: EntityStats;
  effects: Effect[];
  cooldowns: CooldownState[];
  alive: boolean;
}

export interface WorldState {
  matchId: string;
  entities: Record<EntityId, EntityState>;
  /** Optional: Seed für deterministische Rolls später */
  seed?: number;
}

// ---------------------------------------------------------------------------
// Intents (Absichten – noch keine Wirkung)
// ---------------------------------------------------------------------------

export interface BasicAttackIntent {
  type: "basic_attack";
  sourceId: EntityId;
  /** Vom Phaser-Overlap/Cone befüllt */
  targetIds?: EntityId[];
  aimX?: number;
  aimY?: number;
}

export interface SkillIntent {
  type: "skill";
  sourceId: EntityId;
  skillId: SkillId;
  targetIds?: EntityId[];
  aimX?: number;
  aimY?: number;
}

export interface EnemyMeleeIntent {
  type: "enemy_melee";
  sourceId: EntityId;
  targetId: EntityId;
}

export interface EnemyProjectileHitIntent {
  type: "enemy_projectile_hit";
  sourceId: EntityId;
  targetId: EntityId;
  /** Roher Schaden laut Enemy-Stats; Mitigation in der Engine */
  damage: number;
}

export type Intent =
  | BasicAttackIntent
  | SkillIntent
  | EnemyMeleeIntent
  | EnemyProjectileHitIntent;

// ---------------------------------------------------------------------------
// Rule events (Wirkung)
// ---------------------------------------------------------------------------

export interface DamageEvent {
  type: "damage";
  sourceId: EntityId;
  targetId: EntityId;
  amount: number;
  rawAmount: number;
}

export interface HealEvent {
  type: "heal";
  targetId: EntityId;
  amount: number;
}

export interface EffectAddEvent {
  type: "effect_add";
  targetId: EntityId;
  effect: Effect;
}

export interface EffectRemoveEvent {
  type: "effect_remove";
  targetId: EntityId;
  effectId: string;
}

export interface SpawnProjectileEvent {
  type: "spawn_projectile";
  ownerId: EntityId;
  kind: "hero_basic" | "fireball" | "rapid_fire" | "slow_shot" | "enemy_spit";
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  damage: number;
  aoeRadius?: number;
  appliesSlow?: { factor: number; durationMs: number };
}

export interface MoveImpulseEvent {
  type: "move_impulse";
  targetId: EntityId;
  /** Absolute Zielposition oder Delta – Team-Konvention festlegen */
  x: number;
  y: number;
  mode: "dash" | "blink";
}

export interface DiedEvent {
  type: "died";
  targetId: EntityId;
  killerId?: EntityId;
  xp?: number;
}

export interface CooldownEvent {
  type: "cooldown";
  sourceId: EntityId;
  skillId: SkillId;
  readyAt: number;
}

export interface ResourceEvent {
  type: "resource";
  targetId: EntityId;
  resource: "mana" | "stamina" | "hp";
  value: number;
  max: number;
}

export type RuleEvent =
  | DamageEvent
  | HealEvent
  | EffectAddEvent
  | EffectRemoveEvent
  | SpawnProjectileEvent
  | MoveImpulseEvent
  | DiedEvent
  | CooldownEvent
  | ResourceEvent;

// ---------------------------------------------------------------------------
// Skill definitions (data)
// ---------------------------------------------------------------------------

export interface SkillDef {
  id: SkillId;
  cdMs: number;
  manaCost?: number;
  staminaCost?: number;
  /** Direkter Schaden bei Resolve (Nah) */
  damage?: number;
  durationMs?: number;
  /** Schildwall: Multiplikator auf eingehenden Schaden */
  damageTakenFactor?: number;
  slowFactor?: number;
  shots?: number;
  aoeRadius?: number;
  blinkDistance?: number;
}

export type SkillDefMap = Record<SkillId, SkillDef>;

// ---------------------------------------------------------------------------
// Engine API
// ---------------------------------------------------------------------------

export interface RuleEngineConfig {
  skills: SkillDefMap;
  /** Enemy-XP / Basis-Schaden kann von außen kommen */
  getEnemyXp?: (enemyType: EnemyTypeId) => number;
}

export interface RuleEngine {
  /** Reine Entscheidung – mutiert world idealerweise über returned events + separaten apply */
  resolve(intent: Intent, world: WorldState, now: number): RuleEvent[];

  /** Ablaufen von Effects; liefert z. B. effect_remove */
  tick(world: WorldState, now: number): RuleEvent[];
}

/**
 * Wendet Events auf WorldState an (Mutation oder immutable – Teamwahl).
 * Phaser liest danach HP/Effects für Sprites.
 */
export type ApplyRuleEvents = (
  world: WorldState,
  events: RuleEvent[]
) => WorldState;
```

---

## 4. Beispiel SkillDefMap (Startwerte)

```ts
export const DEFAULT_SKILLS: SkillDefMap = {
  dash: {
    id: "dash",
    cdMs: 7000,
    staminaCost: 20,
    damage: 15,
  },
  shield_wall: {
    id: "shield_wall",
    cdMs: 12000,
    staminaCost: 25,
    durationMs: 2500,
    damageTakenFactor: 0.35,
  },
  rapid_fire: {
    id: "rapid_fire",
    cdMs: 7000,
    staminaCost: 15,
    damage: 8,
    shots: 3,
  },
  slow_shot: {
    id: "slow_shot",
    cdMs: 10000,
    staminaCost: 18,
    damage: 6,
    slowFactor: 0.4,
    durationMs: 2500,
  },
  fireball: {
    id: "fireball",
    cdMs: 8000,
    manaCost: 30,
    damage: 22,
    aoeRadius: 48,
  },
  blink: {
    id: "blink",
    cdMs: 14000,
    manaCost: 20,
    blinkDistance: 80,
  },
};
```

---

## 5. Engine-Verantwortlichkeiten

| Engine | Phaser |
|--------|--------|
| CD / Mana / Stamina prüfen | Input, Aim-Vektor |
| Schaden + Mitigation (Schildwall) | Cone/Overlap → `targetIds` |
| Effects setzen/entfernen | Speed-Mul am Sprite aus Effects |
| `spawn_projectile` Events | Projektil-Entities spawnen |
| `died` + XP | Anim, dann React/Bridge |
| `move_impulse` | Position setzen, Collision |

---

## 6. Apply-Konvention

1. `events = engine.resolve(intent, world, now)`
2. `world = applyRuleEvents(world, events)` (HP, cooldowns, effects)
3. Side effects: Sprites, `gameBridge.emit("player:hp", …)`

`resolve` sollte **keine** Phaser-APIs importieren (unit-testbar).

---

## 7. Klassen → erlaubte Skills

```ts
export const CLASS_SKILLS: Record<HeroClass, SkillId[]> = {
  melee: ["dash", "shield_wall"],
  ranged: ["rapid_fire", "slow_shot"],
  mage: ["fireball", "blink"],
};
```

Basisangriff ist kein `SkillId`, sondern `BasicAttackIntent` (Schaden aus `entity.stats.atk`).

---

## 8. MVP-Scope

**In scope:** Damage, DR, Slow, CDs, Ressourcen, Projektile-Events, Tod/XP, Dash/Blink-Impulse.  
**Out of scope:** DSL, Trigger-Ketten, serverseitige Deterministik, Pathfinding.

---

## 9. Test-Ideen (ohne Phaser)

- Schildwall aktiv → `damage.amount < rawAmount`
- Skill während CD → `[]` oder kein `cooldown`-Refresh
- `tick` nach `expiresAt` → `effect_remove`
- `hp` nach Damage ≤ 0 → `died`
- Falsche Klasse + Skill → `[]`

---

## 10. Ein-Satz-Zusammenfassung

**RuleEngine: `Intent + WorldState + now → RuleEvent[]` – TypeScript-Interfaces legen Entities, Effects, Skills und Events fest; Phaser bleibt I/O und Darstellung.**

---

## Verwandte Docs

- [17-mvp-gameplay.md](./17-mvp-gameplay.md) – Skills pro Klasse
- [18-enemy-ai.md](./18-enemy-ai.md) – wann Intents von Enemies kommen
- [14-phaser-react-bridge.md](./14-phaser-react-bridge.md) – HUD-Events
