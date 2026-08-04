import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents } from '../core/GameEvents';

export type NPCState = 'idle' | 'walk' | 'chase' | 'attack' | 'dialog';

export interface NPCStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  visionRange: number;
}

export interface NPCDialogue {
  text: string;
  options?: string[];
}

export default class NPC {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  stats: NPCStats;
  state: NPCState;
  name: string;
  id = '';
  dialogue: NPCDialogue[];
  dialogueIndex: number;
  lastDecisionTime: number;
  patrolPoints: Phaser.Math.Vector2[];
  currentPatrolIndex: number;
  playerRef: { x: number; y: number } | null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    name: string,
    dialogue: NPCDialogue[],
  ) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    this.stats = {
      hp: 50,
      maxHp: 50,
      attack: 5,
      defense: 2,
      speed: 40,
      visionRange: 120,
    };
    this.name = name;
    this.id = name;
    this.dialogue = dialogue;
    this.dialogueIndex = 0;
    this.state = 'idle';
    this.lastDecisionTime = 0;
    this.patrolPoints = [];
    this.currentPatrolIndex = 0;
    this.playerRef = null;
  }

  setPlayerRef(player: { x: number; y: number }) {
    this.playerRef = player;
  }

  setPatrolPoints(points: Phaser.Math.Vector2[]) {
    this.patrolPoints = points;
    this.currentPatrolIndex = 0;
  }

  update(time: number, _delta: number) {
    if (!this.playerRef) return;
    this.playerRef.x = this.playerRef.x;
    this.playerRef.y = this.playerRef.y;

    if (time - this.lastDecisionTime < 500) {
      this.act(_delta);
      return;
    }
    this.lastDecisionTime = time;
  this.think();
    this.act(_delta);
  }

  think() {
    if (!this.playerRef) {
      if (this.patrolPoints.length > 0) {
        this.state = 'walk';
      } else {
        this.state = 'idle';
      }
      return;
    }

    const dist = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      this.playerRef.x,
      this.playerRef.y,
    );

    if (dist <= 30) {
      this.state = 'attack';
    } else if (dist <= this.stats.visionRange) {
      this.state = 'chase';
    } else if (this.patrolPoints.length > 0) {
      this.state = 'walk';
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

      case 'walk':
        if (this.patrolPoints.length > 0) {
          const target = this.patrolPoints[this.currentPatrolIndex];
          const dist = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            target.x,
            target.y,
          );
          if (dist < 5) {
            this.currentPatrolIndex =
              (this.currentPatrolIndex + 1) % this.patrolPoints.length;
          } else {
            const angle = Phaser.Math.Angle.Between(
              this.sprite.x,
              this.sprite.y,
              target.x,
              target.y,
            );
            body.setVelocity(
              Math.cos(angle) * this.stats.speed,
              Math.sin(angle) * this.stats.speed,
            );
          }
        }
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
        break;

      case 'dialog':
        body.setVelocity(0);
        break;
    }

    gameBridge.emit(PhaserEvents.NPC_STATE_CHANGED, {
      name: this.name,
      state: this.state,
    });
  }

  startDialog() {
    this.state = 'dialog';
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    const d = this.dialogue[this.dialogueIndex];
    gameBridge.emit(PhaserEvents.DIALOG_START, {
      npc: this.name,
      text: d.text,
      options: d.options || [],
    });
  }

  nextDialogOption(index: number) {
    const current = this.dialogue[this.dialogueIndex];
    if (!current) return;
    if (index < (current.options?.length ?? 0) || !current.options) {
      this.dialogueIndex++;
      if (this.dialogueIndex >= this.dialogue.length) {
        this.dialogueIndex = 0;
        this.state = 'idle';
        gameBridge.emit(PhaserEvents.DIALOG_OPTION, {
          npc: this.name,
          selected: -1,
          closed: true,
        });
      } else {
        gameBridge.emit(PhaserEvents.DIALOG_START, {
          npc: this.name,
          text: this.dialogue[this.dialogueIndex].text,
          options: this.dialogue[this.dialogueIndex].options || [],
        });
      }
    }
    gameBridge.emit(PhaserEvents.DIALOG_OPTION, {
      npc: this.name,
      selected: index,
    });
  }

  takeDamage(amount: number) {
    const actual = Math.max(1, amount - this.stats.defense);
    this.stats.hp = Math.max(0, this.stats.hp - actual);
    return actual;
  }

  isDead(): boolean {
    return this.stats.hp <= 0;
  }
}