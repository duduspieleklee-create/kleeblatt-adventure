import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents } from '../core/GameEvents';
import Player from '../entities/Player';
import skillsData from '../data/skills.json' with { type: 'json' };

interface SkillDef {
  id: string;
  label: string;
  power: number;
  costMana?: number;
  costStamina?: number;
  cooldown: number;
  type: string;
  range: string;
}

interface CombatEntity {
  stats: { attack: number; defense: number; hp?: number; mana?: number; stamina?: number };
  sprite: Phaser.GameObjects.Sprite;
  id: string;
  isDead?: () => boolean;
}

interface CombatSystemRef {
  attack(attacker: CombatEntity, target: CombatEntity, skill: { power: number }): void;
}

type SkillsData = SkillDef[];

export default class SkillSystem {
  private scene: Phaser.Scene;
  private cooldowns: Record<string, number> = {};
  private combatSystem: CombatSystemRef | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setCombatSystem(combatSystem: CombatSystemRef): void {
    this.combatSystem = combatSystem;
  }

  private findSkill(skillId: string): SkillDef | undefined {
    return (skillsData as SkillsData).find(s => s.id === skillId);
  }

  canUse(skillId: string): boolean {
    const now = Date.now();
    const readyAt = this.cooldowns[skillId] || 0;
    return now >= readyAt;
  }

  useSkill(attacker: CombatEntity, target: CombatEntity, skillId: string): boolean {
    const skill = this.findSkill(skillId);
    if (!skill) return false;
    if (!this.canUse(skillId)) return false;
    if (!this.combatSystem) return false;

    const player = (this.scene as { player?: Player }).player as Player;
    if (!player) return false;

    if (skill.costMana && player.stats.mana < skill.costMana) return false;
    if (skill.costStamina && player.stats.stamina < skill.costStamina) return false;

    if (skill.costMana) {
      player.stats.mana -= skill.costMana;
      gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED, { ...player.stats });
    }

    if (skill.costStamina) {
      player.stats.stamina -= skill.costStamina;
      gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED, { ...player.stats });
    }

    this.cooldowns[skillId] = Date.now() + skill.cooldown * 1000;

    if (skill.power > 0) {
      this.combatSystem.attack(attacker, target, { power: skill.power });
    } else if (skill.power < 0) {
      const healAmount = Math.abs(skill.power);
      player.heal(healAmount);
    }

    const cooldownMs = skill.cooldown * 1000;
    setTimeout(() => {
      delete this.cooldowns[skillId];
      gameBridge.emit(PhaserEvents.SKILL_READY, { skillId });
    }, cooldownMs);

    return true;
  }

  getCooldowns(): Record<string, number> {
    return { ...this.cooldowns };
  }
}