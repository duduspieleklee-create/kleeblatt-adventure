import Phaser from "phaser";
import { applyCharacterBodyWhenReady } from "./characterBody";

export class SunnysidePlayer extends Phaser.Physics.Arcade.Sprite {
  private lastDir: "down" | "side" | "up" = "down";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "ss_idle", 1);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setScale(0.6);
    this.setOrigin(0.5, 0.5);

    applyCharacterBodyWhenReady(scene, this);
    this.createAnimations(scene);
  }

  private createAnimations(scene: Phaser.Scene): void {
    const idleDown = [1, 3, 5, 7];
    const idleSide = [0, 4, 8];
    const idleUp = [2, 6];
    const walkDown = [1, 3, 5, 7];
    const walkSide = [0, 4];
    const walkUp = [2, 6];

    const ensure = (
      key: string,
      frames: number[],
      texture: string,
      frameRate: number,
    ) => {
      if (scene.anims.exists(key)) return;
      scene.anims.create({
        key,
        frames: frames.map((f) => ({ key: texture, frame: f })),
        frameRate,
        repeat: -1,
      });
    };

    ensure("ss_idle_down", idleDown, "ss_idle", 6);
    ensure("ss_idle_side", idleSide, "ss_idle", 6);
    ensure("ss_idle_up", idleUp, "ss_idle", 6);
    ensure("ss_walk_down", walkDown, "ss_walk", 10);
    ensure("ss_walk_side", walkSide, "ss_walk", 10);
    ensure("ss_walk_up", walkUp, "ss_walk", 10);
  }

  applyMovementResult(result: { vx: number; vy: number; isMoving: boolean }): void {
    const { vx, vy, isMoving } = result;

    if (vy > 0.3) this.lastDir = "down";
    else if (vy < -0.3) this.lastDir = "up";
    else if (vx !== 0) this.lastDir = "side";

    if (vx < -0.05) this.setFlipX(true);
    if (vx > 0.05) this.setFlipX(false);

    const anim = isMoving ? `ss_walk_${this.lastDir}` : `ss_idle_${this.lastDir}`;
    if (this.anims.currentAnim?.key !== anim) this.anims.play(anim);
  }
}
