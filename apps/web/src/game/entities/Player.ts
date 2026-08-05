import { gameBridge } from '../../../lib/gameBridge';
import { PhaserEvents } from '../../../core/GameEvents';

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  attack: number;
  defense: number;
  xp: number;
  level: number;
  gold: number;
}

export default class Player {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  stats: PlayerStats;
  id = 'player';

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    // ★★★ KORREKTE HITBOX ★★★
    (this.sprite.body as Phaser.Physics.Arcade.Body).setSize(16, 24);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setOffset(8, 8);

    this.stats = {
      hp: 100,
      maxHp: 100,
      mana: 50,
      maxMana: 50,
      stamina: 100,
      maxStamina: 100,
      attack: 10,
      defense: 5,
      xp: 0,
      level: 1,
      gold: 0,
    };
  }

  update(
    keys: {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    },
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
  ) {
    const speed = 120;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    if (keys.W.isDown || cursors.up.isDown) body.setVelocityY(-speed);
    if (keys.S.isDown || cursors.down.isDown) body.setVelocityY(speed);
    if (keys.A.isDown || cursors.left.isDown) body.setVelocityX(-speed);
    if (keys.D.isDown || cursors.right.isDown) body.setVelocityX(speed);
  }

  takeDamage(amount: number) {
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    gameBridge.emit(PhaserEvents.PLAYER_HP_CHANGED, {
      hp: this.stats.hp,
      maxHp: this.stats.maxHp,
    });
    gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED, { ...this.stats });
  }

  heal(amount: number) {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    gameBridge.emit(PhaserEvents.PLAYER_HP_CHANGED, {
      hp: this.stats.hp,
      maxHp: this.stats.maxHp,
    });
  }

  gainXp(amount: number) {
    this.stats.xp += amount;
    const xpNeeded = this.stats.level * 100;
    if (this.stats.xp >= xpNeeded) {
      this.stats.xp -= xpNeeded;
      this.stats.level++;
      this.stats.maxHp += 12;
      this.stats.hp = this.stats.maxHp;
      this.stats.attack += 2;
      this.stats.defense += 1;
    }
    gameBridge.emit(PhaserEvents.PLAYER_XP_CHANGED, {
      xp: this.stats.xp,
      level: this.stats.level,
    });
    gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED, { ...this.stats });
  }

  addGold(amount: number) {
    this.stats.gold += amount;
    gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED, { ...this.stats });
  }

  spendGold(amount: number): boolean {
    if (this.stats.gold < amount) return false;
    this.stats.gold -= amount;
    gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED, { ...this.stats });
    return true;
  }
}
