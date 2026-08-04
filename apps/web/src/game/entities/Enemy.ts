import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents } from '../core/GameEvents';

export type EnemyState = 'idle' | 'chase' | 'attack';

export interface EnemyStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  xpReward: number;
  goldRewardMin: number;
  goldRewardMax: number;
}

export default class Enemy {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  stats: EnemyStats;
  state: EnemyState;
  name: string;
  playerRef: { x: number; y: number } | null;
  lastDecisionTime: number;
  attackCooldown: number;
  lastAttackTime: number;
  visionRange: number;
  attackRange: number;

  id = '';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    name: string,
    stats: Partial<EnemyStats> = {},
  ) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    this.name = name;
    this.id = name;
    this.stats = {
      hp: 30,
      maxHp: 30,
      attack: 8,
      defense: 3,
      speed: 60,
      xpReward: 25,
      goldRewardMin: 5,
      goldRewardMax: 15,
      ...stats,
    };
    this.stats.hp = this.stats.maxHp;
    this.state = 'idle';
    this.playerRef = null;
    this.lastDecisionTime = 0;
    this.attackCooldown = 1000;
    this.lastAttackTime = 0;
    this.visionRange = 120;
    this.attackRange = 30;

    gameBridge.emit(PhaserEvents.ENEMY_SPAWNED, {
      name: this.name,
      x,
      y,
    });
  }

  setPlayerRef(player: { x: number; y: number }) {
    this.playerRef = player;
  }

  update(time: number, delta: number) {
    if (!this.playerRef) return;

    if (time - this.lastDecisionTime < 500) {
      this.act(delta);
      return;
    }

    this.lastDecisionTime = time;
    this.think();
    this.act(delta);
  }

  think() {
    if (!this.playerRef) {
      this.state = 'idle';
      return;
    }

    const dist = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      this.playerRef.x,
      this.playerRef.y,
    );

    if (dist <= this.attackRange) {
      this.state = 'attack';
    } else if (dist <= this.visionRange) {
      this.state = 'chase';
    } else {
      this.state = 'idle';
    }
  }

  act(_delta: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    switch (this.state) {
      case 'idle':
        body.setVelocity(0);
        break;

      case 'chase':
        if (this.playerRef) {
          const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            this.playerRef.x,
            this.playerRef.y,
          );
          body.setVelocity(
            Math.cos(angle) * this.stats.speed,
            Math.sin(angle) * this.stats.speed,
          );
        }
        break;

      case 'attack':
        body.setVelocity(0);
        this.tryAttack();
        break;
    }

    gameBridge.emit(PhaserEvents.NPC_STATE_CHANGED, {
      name: this.name,
      state: this.state,
    });
  }

  tryAttack() {
    const time = this.scene.time;
    if (time.now - this.lastAttackTime < this.attackCooldown) return;
    this.lastAttackTime = time.now;

    if (this.playerRef) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        this.playerRef.x,
        this.playerRef.y,
      );
      if (dist <= this.attackRange) {
        gameBridge.emit(PhaserEvents.COMBAT_HIT, {
          attacker: this.name,
          damage: this.stats.attack,
        });
      }
    }
  }

  takeDamage(amount: number) {
    const actual = Math.max(1, amount - this.stats.defense);
    this.stats.hp = Math.max(0, this.stats.hp - actual);
    gameBridge.emit(PhaserEvents.COMBAT_HIT, {
      target: this.name,
      damage: actual,
    });
    return actual;
  }

  isDead(): boolean {
    return this.stats.hp <= 0;
  }

  getRewards(): { xp: number; gold: number } {
    const gold =
      Phaser.Math.Between(
        this.stats.goldRewardMin,
        this.stats.goldRewardMax,
      );
    return {
      xp: this.stats.xpReward,
      gold,
    };
  }

  die() {
    const rewards = this.getRewards();
    gameBridge.emit(PhaserEvents.ENEMY_KILLED, {
      name: this.name,
      ...rewards,
    });
    gameBridge.emit(PhaserEvents.COMBAT_DEATH, {
      name: this.name,
    });
    this.sprite.visible = false;
    (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}