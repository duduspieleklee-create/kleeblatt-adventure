import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents } from '../core/GameEvents';

export default class InteractionZone {
  scene: Phaser.Scene;
  zone: Phaser.GameObjects.Zone;
  callback: ((data: { x: number; y: number }) => void) | null;
  interactWith: Phaser.GameObjects.GameObject;
  width: number;
  height: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 48,
    height: number = 48,
    interactWith: Phaser.GameObjects.GameObject,
  ) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.zone = scene.add.zone(x, y, width, height);
    scene.physics.add.existing(this.zone);
    this.interactWith = interactWith;
    this.callback = null;
  }

  setCallback(fn: (data: { x: number; y: number }) => void) {
    this.callback = fn;
  }

  trigger(data: { x: number; y: number }) {
    gameBridge.emit(PhaserEvents.INTERACTION, {
      target: this.interactWith,
      zone: { x: this.zone.x, y: this.zone.y },
      ...data,
    });
    if (this.callback) {
      this.callback(data);
    }
  }

checkOverlap(playerSprite: Phaser.GameObjects.Sprite) {
    const px = playerSprite.x;
    const py = playerSprite.y;
    const zx = this.zone.x;
    const zy = this.zone.y;
    const hw = this.width / 2;
    const hh = this.height / 2;
    return px > zx - hw && px < zx + hw && py > zy - hh && py < zy + hh;
  }

  setOverlapWith(playerSprite: Phaser.GameObjects.Sprite, onOverlap: () => void) {
    this.scene.physics.add.overlap(playerSprite, this.zone, () => {
      onOverlap();
      this.trigger({
        x: playerSprite.x,
        y: playerSprite.y,
      });
    }, undefined, this);
  }

  setPosition(x: number, y: number) {
    this.zone.setPosition(x, y);
    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.position.set(x, y);
    }
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.zone.setSize(width, height);
    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(width, height);
    }
  }

  destroy() {
    this.zone.destroy();
  }
}