import Phaser from "phaser";

export const CHARACTER_BODY = {
  width: 18,
  height: 12,
  offsetX: 39,
  offsetY: 46,
} as const;

export function applyCharacterBody(sprite: Phaser.Physics.Arcade.Sprite): void {
  const body = sprite.body;
  if (!body || !(body instanceof Phaser.Physics.Arcade.Body)) return;
  body.updateBounds();
  body.setSize(CHARACTER_BODY.width, CHARACTER_BODY.height);
  body.setOffset(CHARACTER_BODY.offsetX, CHARACTER_BODY.offsetY);
}

export function applyCharacterBodyWhenReady(
  scene: Phaser.Scene,
  sprite: Phaser.Physics.Arcade.Sprite,
): void {
  applyCharacterBody(sprite);
  scene.events.once(Phaser.Scenes.Events.UPDATE, () => {
    applyCharacterBody(sprite);
  });
}
