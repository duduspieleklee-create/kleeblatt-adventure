/**
 * RuleEngine types – unit-testable combat rules (no Phaser).
 *
 * Contracts: docs/architecture/19-phaser-rule-engine.md
 */

import type { HeroClass } from "../types/hero.js";

// ---------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------

export type EntityId = string;
export type EnemyTypeId = "bruiser" | "runner" | "spitter";

export type SkillId = "dash" | "shield_wall" | "rapid_fire" | "slow_shot" | "fireball" | "blink";

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

export type EffectKind = "damage_reduction" | "slow";

export interface EffectBase {
  id: string;
  kind: EffectKind;
  expiresAt: number; // now (ms)
}

export interface DamageReductionEffect extends EffectBase {
  kind: "damage_reduction";
  /** 0.35 = incoming damage multiplied by 0.35 (65 % reduction) */
  factor: number;
}

export interface SlowEffect extends EffectBase {
  kind: "slow";
  /** 0.4 = 40 % of normal speed */
  factor: number;
}

export type Effect = DamageReductionEffect | SlowEffect;

// ---------------------------------------------------------------------------
// World snapshot
// ---------------------------------------------------------------------------

export interface CooldownState {
  skillId: SkillId;
  readyAt: number;
}

export interface EntityStats {
  maxHp: number;
  atk: number;
  speed: number;
  maxMana?: number;
  maxStamina?: number;
}

export interface EntityState {
  id: EntityId;
  kind: "hero" | "enemy";
  heroClass?: HeroClass;
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
  seed?: number;
}

// ---------------------------------------------------------------------------
// Intents
// ---------------------------------------------------------------------------

export interface BasicAttackIntent {
  type: "basic_attack";
  sourceId: EntityId;
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
  damage: number;
}

export type Intent = BasicAttackIntent | SkillIntent | EnemyMeleeIntent | EnemyProjectileHitIntent;

// ---------------------------------------------------------------------------
// Rule events
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
// Skill definitions
// ---------------------------------------------------------------------------

export interface SkillDef {
  id: SkillId;
  cdMs: number;
  manaCost?: number;
  staminaCost?: number;
  damage?: number;
  durationMs?: number;
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
  getEnemyXp?: (enemyType: EnemyTypeId) => number;
}

export interface RuleEngine {
  resolve(intent: Intent, world: WorldState, now: number): RuleEvent[];
  tick(world: WorldState, now: number): RuleEvent[];
}

export type ApplyRuleEvents = (world: WorldState, events: RuleEvent[]) => WorldState;
