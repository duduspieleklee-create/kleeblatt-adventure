/**
 * @kleeblatt/shared – rules module
 *
 * RuleEngine: pure combat rules (Intent + WorldState + now → RuleEvent[]).
 * No Phaser dependency – unit-testable.
 */

export type {
  EntityId,
  EnemyTypeId,
  SkillId,
  EffectKind,
  EffectBase,
  DamageReductionEffect,
  SlowEffect,
  Effect,
  CooldownState,
  EntityStats,
  EntityState,
  WorldState,
  BasicAttackIntent,
  SkillIntent,
  EnemyMeleeIntent,
  EnemyProjectileHitIntent,
  Intent,
  DamageEvent,
  HealEvent,
  EffectAddEvent,
  EffectRemoveEvent,
  SpawnProjectileEvent,
  MoveImpulseEvent,
  DiedEvent,
  CooldownEvent,
  ResourceEvent,
  RuleEvent,
  SkillDef,
  SkillDefMap,
  RuleEngineConfig,
  RuleEngine,
  ApplyRuleEvents,
} from "./types.js";

export { createRuleEngine, applyRuleEvents } from "./engine.js";
export { DEFAULT_SKILLS, CLASS_SKILLS, defaultEnemyXp } from "./defaults.js";