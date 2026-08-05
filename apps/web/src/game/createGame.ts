import Phaser from "phaser";
import { BootScene } from "./scenes/boot-scene";
import { MatchScene } from "./scenes/match-scene";
import { TownScene } from "./scenes/TownScene";
import { GAME_VIEWPORT } from "./constants";

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
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, MatchScene, TownScene],
  });
}