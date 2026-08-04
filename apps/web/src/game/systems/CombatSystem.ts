import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents } from '../core/GameEvents';
import Player from '../entities/Player';

interface CombatEntity {
  stats: { attack: number; defense: number; hp?: number };
  sprite: Phaser.GameObjects.Sprite;
  id: string;
  isDead?: () => boolean;
}

interface SkillDef {
  power: number;
}

interface LootSystemRef {
  dropLoot(enemyId: string): void;
}

export default class CombatSystem {
  private scene: Phaser.Scene;
  private lootSystem: LootSystemRef | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setLootSystem(lootSystem: LootSystemRef): void {
    this.lootSystem = lootSystem;
  }

  attack(attacker: CombatEntity, target: CombatEntity, skill: SkillDef): void {
    const damage = this.calculateDamage(attacker, target, skill);
    this.applyDamage(target, damage);

    gameBridge.emit(PhaserEvents.COMBAT_HIT, {
      attackerId: attacker.id,
      targetId: target.id,
      damage,
      skill,
    });

    if (target.isDead?.() || (target.stats.hp !== undefined && target.stats.hp <= 0)) {
      this.kill(target);
    }
  }

  calculateDamage(attacker: { stats: { attack: number } }, target: { stats: { defense: number } }, skill: SkillDef): number {
    return Math.max(1, skill.power + attacker.stats.attack - target.stats.defense);
  }

  applyDamage(target: CombatEntity, damage: number): void {
    if (target.stats.hp !== undefined) {
      target.stats.hp = Math.max(0, target.stats.hp - damage);
    }
  }

  kill(target: CombatEntity): void {
    const player = (this.scene as any).player as Player;

    if (this.lootSystem) {
      this.lootSystem.dropLoot(target.id);
    }

    if (player) {
      const xpReward = 25 + Math.floor(Math.random() * 25);
      const goldReward = 5 + Math.floor(Math.random() * 15);
      player.gainXp(xpReward);
      player.addGold(goldReward);
    }

    gameBridge.emit(PhaserEvents.COMBAT_DEATH, {
      targetId: target.id,
    });

    gameBridge.emit(PhaserEvents.ENEMY_KILLED, {
      enemyId: target.id,
    });

    this.destroySprite(target.sprite);
  }

  handleDeath(target: CombatEntity): void {
    if (target.isDead?.() || (target.stats.hp !== undefined && target.stats.hp <= 0)) {
      this.kill(target);
    }
  }

  destroySprite(sprite: Phaser.GameObjects.Sprite): void {
    if (sprite.active) {
      sprite.setActive(false);
      sprite.setVisible(false);
      sprite.destroy();
    }
  }
}