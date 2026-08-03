/**
 * RuleEngine – pure combat rules (no Phaser, unit-testable).
 *
 * resolve(Intent, WorldState, now) → RuleEvent[]
 * tick(WorldState, now) → RuleEvent[]
 */

import type {
  Intent,
  RuleEvent,
  SkillId,
  WorldState,
  RuleEngine,
  RuleEngineConfig,
  BasicAttackIntent,
  SkillIntent,
  EnemyMeleeIntent,
  EnemyProjectileHitIntent,
  SkillDef,
  DamageReductionEffect,
  CooldownState,
} from "./types.js";
import { CLASS_SKILLS, DEFAULT_SKILLS } from "./defaults.js";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function hasEffect(entity: { effects: RuleEvent[] }, kind: string): boolean {
  return entity.effects.some((e: any) => e.kind === kind && e.expiresAt > 0);
}

function getDrFactor(entity: { effects: any[] }): number {
  const now = 0; // placeholder
  for (const e of entity.effects) {
    if (e.kind === "damage_reduction" && e.expiresAt > now) {
      return (e as DamageReductionEffect).factor;
    }
  }
  return 1;
}

function getDrFactorAt(entity: { effects: any[] }, now: number): number {
  for (const e of entity.effects) {
    if (e.kind === "damage_reduction" && e.expiresAt > now) {
      return (e as DamageReductionEffect).factor;
    }
  }
  return 1;
}

function isOnCooldown(cooldowns: CooldownState[], skillId: SkillId, now: number): boolean {
  return cooldowns.some((c) => c.skillId === skillId && c.readyAt > now);
}

function setCooldown(cooldowns: CooldownState[], skillId: string, readyAt: number): CooldownState[] {
  return cooldowns.map((c) => (c.skillId === skillId ? { ...c, readyAt } : c));
}

function addCooldown(cooldowns: CooldownState[], skillId: SkillId, readyAt: number): CooldownState[] {
  const existing = cooldowns.find((c) => c.skillId === skillId);
  if (existing) return setCooldown(cooldowns, skillId, readyAt);
  return [...cooldowns, { skillId, readyAt }];
}

function canUseSkill(
  def: SkillDef,
  entity: { mana?: number; stamina?: number; cooldowns: CooldownState[] },
  now: number,
): boolean {
  if (isOnCooldown(entity.cooldowns, def.id, now)) return false;
  if (def.manaCost !== undefined && def.manaCost > 0) {
    if ((entity.mana ?? 0) < def.manaCost) return false;
  }
  if (def.staminaCost !== undefined && def.staminaCost > 0) {
    if ((entity.stamina ?? 0) < def.staminaCost) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// applyRuleEvents
// ---------------------------------------------------------------------------

export function applyRuleEvents(world: WorldState, events: RuleEvent[]): WorldState {
  for (const ev of events) {
    switch (ev.type) {
      case "damage": {
        const target = world.entities[ev.targetId];
        if (target) {
          target.hp = Math.max(0, target.hp - ev.amount);
          if (target.hp <= 0 && target.alive) {
            target.alive = false;
          }
        }
        break;
      }
      case "heal": {
        const target = world.entities[ev.targetId];
        if (target) {
          target.hp = Math.min(target.stats.maxHp, target.hp + ev.amount);
        }
        break;
      }
      case "effect_add": {
        const target = world.entities[ev.targetId];
        if (target) {
          target.effects.push(ev.effect);
        }
        break;
      }
      case "effect_remove": {
        const target = world.entities[ev.targetId];
        if (target) {
          target.effects = target.effects.filter((e) => e.id !== ev.effectId);
        }
        break;
      }
      case "died": {
        const target = world.entities[ev.targetId];
        if (target) target.alive = false;
        break;
      }
      case "cooldown": {
        const source = world.entities[ev.sourceId];
        if (source) {
          source.cooldowns = setCooldown(source.cooldowns, ev.skillId, ev.readyAt);
        }
        break;
      }
      case "resource": {
        const target = world.entities[ev.targetId];
        if (target) {
          if (ev.resource === "hp") target.hp = ev.value;
          else if (ev.resource === "mana") target.mana = ev.value;
          else if (ev.resource === "stamina") target.stamina = ev.value;
        }
        break;
      }
      // spawn_projectile, move_impulse – Phaser handles them
    }
  }
  return world;
}

// ---------------------------------------------------------------------------
// RuleEngine implementation
// ---------------------------------------------------------------------------

export function createRuleEngine(config: RuleEngineConfig): RuleEngine {
  const skills = config.skills ?? DEFAULT_SKILLS;
  const getEnemyXp = config.getEnemyXp;

  function resolve(intent: Intent, world: WorldState, now: number): RuleEvent[] {
    const events: RuleEvent[] = [];

    switch (intent.type) {
      case "basic_attack":
        events.push(...resolveBasicAttack(intent, world, now));
        break;
      case "skill":
        events.push(...resolveSkill(intent, world, now));
        break;
      case "enemy_melee":
        events.push(...resolveEnemyMelee(intent, world, now));
        break;
      case "enemy_projectile_hit":
        events.push(...resolveEnemyProjectileHit(intent, world, now));
        break;
    }

    return events;
  }

  function resolveBasicAttack(
    intent: BasicAttackIntent,
    world: WorldState,
    now: number,
  ): RuleEvent[] {
    const events: RuleEvent[] = [];
    const source = world.entities[intent.sourceId];
    if (!source || !source.alive) return events;

    const targets = intent.targetIds?.filter((tid) => world.entities[tid]?.alive) ?? [];
    if (targets.length === 0) return events;

    const rawDamage = source.stats.atk;
    for (const tid of targets) {
      const target = world.entities[tid];
      if (!target) continue;
      const dr = getDrFactorAt(target, now);
      const amount = Math.max(1, Math.round(rawDamage * dr));
      events.push({
        type: "damage",
        sourceId: intent.sourceId,
        targetId: tid,
        amount,
        rawAmount: rawDamage,
      });
      if (amount >= target.hp) {
        const xp = target.enemyType ? (getEnemyXp?.(target.enemyType) ?? 10) : undefined;
        events.push({
          type: "died",
          targetId: tid,
          killerId: intent.sourceId,
          xp,
        });
      }
    }
    return events;
  }

  function resolveSkill(
    intent: SkillIntent,
    world: WorldState,
    now: number,
  ): RuleEvent[] {
    const events: RuleEvent[] = [];
    const source = world.entities[intent.sourceId];
    if (!source || !source.alive || source.kind !== "hero") return events;

    const def = skills[intent.skillId];
    if (!def) return events;

    // Check class has this skill
    const allowed = CLASS_SKILLS[source.heroClass ?? ""] ?? [];
    if (!allowed.includes(intent.skillId)) return events;

    // Check resource + cooldown
    if (!canUseSkill(def, source, now)) return events;

    // Deduct resources
    let newMana = source.mana;
    let newStamina = source.stamina;
    if (def.manaCost) newMana = (source.mana ?? 0) - def.manaCost;
    if (def.staminaCost) newStamina = (source.stamina ?? 0) - def.staminaCost;

    if (newMana !== undefined) {
      events.push({
        type: "resource",
        targetId: intent.sourceId,
        resource: "mana",
        value: newMana,
        max: source.stats.maxMana ?? 0,
      });
    }
    if (newStamina !== undefined) {
      events.push({
        type: "resource",
        targetId: intent.sourceId,
        resource: "stamina",
        value: newStamina,
        max: source.stats.maxStamina ?? 0,
      });
    }

    // Set cooldown
    events.push({
      type: "cooldown",
      sourceId: intent.sourceId,
      skillId: intent.skillId,
      readyAt: now + def.cdMs,
    });

    // Skill-specific effects
    const targets = intent.targetIds?.filter((tid) => world.entities[tid]?.alive) ?? [];
    const aimX = intent.aimX ?? source.x;
    const aimY = intent.aimY ?? source.y;

    // Damage skills
    if (def.damage) {
      for (const tid of targets) {
        const target = world.entities[tid];
        if (!target) continue;
        const dr = getDrFactorAt(target, now);
        const amount = Math.max(1, Math.round(def.damage * dr));
        events.push({
          type: "damage",
          sourceId: intent.sourceId,
          targetId: tid,
          amount,
          rawAmount: def.damage,
        });
        if (amount >= target.hp) {
          const xp = target.enemyType ? (getEnemyXp?.(target.enemyType) ?? 10) : undefined;
          events.push({
            type: "died",
            targetId: tid,
            killerId: intent.sourceId,
            xp,
          });
        }
      }
    }

    // Projectile skills
    if (intent.skillId === "fireball" || intent.skillId === "rapid_fire" || intent.skillId === "slow_shot") {
      const projKind =
        intent.skillId === "fireball"
          ? "fireball"
          : intent.skillId === "rapid_fire"
            ? "rapid_fire"
            : "slow_shot";
      events.push({
        type: "spawn_projectile",
        ownerId: intent.sourceId,
        kind: projKind,
        fromX: source.x,
        fromY: source.y,
        toX: aimX,
        toY: aimY,
        damage: def.damage ?? 0,
        aoeRadius: def.aoeRadius,
        appliesSlow:
          def.slowFactor !== undefined && def.durationMs
            ? { factor: def.slowFactor, durationMs: def.durationMs }
            : undefined,
      });
    }

    // Shield wall
    if (intent.skillId === "shield_wall" && def.damageTakenFactor !== undefined && def.durationMs) {
      const effect = {
        id: `dr_${now}_${intent.sourceId}`,
        kind: "damage_reduction" as const,
        expiresAt: now + def.durationMs,
        factor: def.damageTakenFactor,
      };
      events.push({
        type: "effect_add",
        targetId: intent.sourceId,
        effect,
      });
    }

    // Dash
    if (intent.skillId === "dash") {
      events.push({
        type: "move_impulse",
        targetId: intent.sourceId,
        x: aimX,
        y: aimY,
        mode: "dash",
      });
    }

    // Blink
    if (intent.skillId === "blink" && def.blinkDistance) {
      events.push({
        type: "move_impulse",
        targetId: intent.sourceId,
        x: aimX,
        y: aimY,
        mode: "blink",
      });
    }

    return events;
  }

  function resolveEnemyMelee(
    intent: EnemyMeleeIntent,
    world: WorldState,
    now: number,
  ): RuleEvent[] {
    const events: RuleEvent[] = [];
    const source = world.entities[intent.sourceId];
    const target = world.entities[intent.targetId];
    if (!source || !source.alive || !target || !target.alive) return events;

    const rawDamage = source.stats.atk;
    const dr = getDrFactorAt(target, now);
    const amount = Math.max(1, Math.round(rawDamage * dr));
    events.push({
      type: "damage",
      sourceId: intent.sourceId,
      targetId: intent.targetId,
      amount,
      rawAmount: rawDamage,
    });
    if (amount >= target.hp) {
      events.push({
        type: "died",
        targetId: intent.targetId,
        killerId: intent.sourceId,
      });
    }
    return events;
  }

  function resolveEnemyProjectileHit(
    intent: EnemyProjectileHitIntent,
    world: WorldState,
    now: number,
  ): RuleEvent[] {
    const events: RuleEvent[] = [];
    const target = world.entities[intent.targetId];
    if (!target || !target.alive) return events;

    const dr = getDrFactorAt(target, now);
    const amount = Math.max(1, Math.round(intent.damage * dr));
    events.push({
      type: "damage",
      sourceId: intent.sourceId,
      targetId: intent.targetId,
      amount,
      rawAmount: intent.damage,
    });
    if (amount >= target.hp) {
      const source = world.entities[intent.sourceId];
      const xp = source?.enemyType ? (getEnemyXp?.(source.enemyType) ?? 10) : undefined;
      events.push({
        type: "died",
        targetId: intent.targetId,
        killerId: intent.sourceId,
        xp,
      });
    }
    return events;
  }

  function tick(world: WorldState, now: number): RuleEvent[] {
    const events: RuleEvent[] = [];
    for (const entity of Object.values(world.entities)) {
      for (const effect of entity.effects) {
        if (effect.expiresAt <= now) {
          events.push({
            type: "effect_remove",
            targetId: entity.id,
            effectId: effect.id,
          });
        }
      }
    }
    return events;
  }

  return { resolve, tick };
}