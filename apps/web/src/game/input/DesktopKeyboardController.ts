import Phaser from "phaser";
import { PlayerInputController } from "./PlayerInputController";
import { InputEvents } from "./InputEvents";

export class DesktopKeyboardController {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private eKey?: Phaser.Input.Keyboard.Key;
  private escKey?: Phaser.Input.Keyboard.Key;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly inputController: PlayerInputController,
    private readonly eventTarget: Phaser.Events.EventEmitter = scene.events,
  ) {
    this.bind();
  }

  private bind(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey("W"),
      down: keyboard.addKey("S"),
      left: keyboard.addKey("A"),
      right: keyboard.addKey("D"),
    };

    this.eKey = keyboard.addKey("E");
    this.escKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.eKey.on(Phaser.Input.Keyboard.Events.DOWN, this.onInteract, this);
    this.escKey.on(Phaser.Input.Keyboard.Events.DOWN, this.onCancel, this);
  }

  update(): void {
    if (!this.cursors) return;

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    const x = (left ? -1 : 0) + (right ? 1 : 0);
    const y = (up ? -1 : 0) + (down ? 1 : 0);

    this.inputController.setMoveVector(x, y);
  }

  private onInteract(): void {
    this.eventTarget.emit(InputEvents.INTERACT);
  }

  private onCancel(): void {
    this.inputController.cancelMovement();
    this.eventTarget.emit(InputEvents.CANCEL);
  }

  shutdown(): void {
    this.eKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.onInteract, this);
    this.escKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.onCancel, this);
  }
}
