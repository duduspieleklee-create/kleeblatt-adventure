import Phaser from "phaser";
import { BootScene } from "./scenes/boot-scene";

/** Viewport der Match-Shell (16:9). Map-Größe kommt aus game-config.json (match.mapSize). */
export const GAME_VIEWPORT = { width: 960, height: 540 } as const;

/**
 * Erstellt das Phaser-Spiel in `container` (React-Page mit Phaser-Container).
 * Aufrufer ist für `game.destroy(true)` beim Unmount verantwortlich.
 */
export function createGame(container: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: GAME_VIEWPORT.width,
    height: GAME_VIEWPORT.height,
    backgroundColor: "#101810",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene],
  });
}
