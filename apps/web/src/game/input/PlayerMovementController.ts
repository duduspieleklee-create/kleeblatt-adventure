import Phaser from "phaser";
import { PlayerInputController } from "./PlayerInputController";

const ARRIVAL_THRESHOLD = 8;

export class PlayerMovementController {
  constructor(
    private readonly input: PlayerInputController,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly speed = 80,
  ) {}

  update(): { vx: number; vy: number; isMoving: boolean } {
    const direction = this.input.getMoveVector();
    const destination = this.input.getDestination();

    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.player.setVelocity(direction.x * this.speed, direction.y * this.speed);
      return { vx: direction.x, vy: direction.y, isMoving: true };
    }

    if (destination) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        destination.x,
        destination.y,
      );

      if (distance <= ARRIVAL_THRESHOLD) {
        this.player.setVelocity(0, 0);
        this.input.clearDestination();
        return { vx: 0, vy: 0, isMoving: false };
      }

      const angle = Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        destination.x,
        destination.y,
      );
      const vx = Math.cos(angle);
      const vy = Math.sin(angle);
      this.player.setVelocity(vx * this.speed, vy * this.speed);
      return { vx, vy, isMoving: true };
    }

    this.player.setVelocity(0, 0);
    return { vx: 0, vy: 0, isMoving: false };
  }
}
