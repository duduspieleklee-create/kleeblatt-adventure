import Phaser from "phaser";

export class PlayerInputController {
  private moveVector = new Phaser.Math.Vector2(0, 0);
  private destination: Phaser.Math.Vector2 | null = null;

  setMoveVector(x: number, y: number): void {
    this.moveVector.set(x, y);
    if (x !== 0 || y !== 0) this.destination = null;
  }

  moveToPoint(x: number, y: number): void {
    this.destination = new Phaser.Math.Vector2(x, y);
    this.moveVector.set(0, 0);
  }

  clearDestination(): void {
    this.destination = null;
  }

  cancelMovement(): void {
    this.moveVector.set(0, 0);
    this.destination = null;
  }

  getMoveVector(): Phaser.Math.Vector2 {
    return this.moveVector.clone();
  }

  getDestination(): Phaser.Math.Vector2 | null {
    return this.destination?.clone() ?? null;
  }
}
