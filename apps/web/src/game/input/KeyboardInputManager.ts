import Phaser from "phaser";
import { PlayerInputController } from "./PlayerInputController";
import { PlayerMovementController } from "./PlayerMovementController";
import { DesktopKeyboardController } from "./DesktopKeyboardController";

/** Keyboard-only input path (pointer/joystick follow later). */
export class KeyboardInputManager {
  private readonly inputController = new PlayerInputController();
  private readonly movement: PlayerMovementController;
  private readonly keyboard: DesktopKeyboardController;

  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite, speed = 80) {
    this.movement = new PlayerMovementController(this.inputController, player, speed);
    this.keyboard = new DesktopKeyboardController(scene, this.inputController);
  }

  update(): { vx: number; vy: number; isMoving: boolean } {
    this.keyboard.update();
    return this.movement.update();
  }

  shutdown(): void {
    this.keyboard.shutdown();
    this.inputController.cancelMovement();
  }
}
