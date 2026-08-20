import Phaser from "phaser";
import { BASE_WIDTH, BASE_HEIGHT } from "./config/GameConfig";
import { IslandBootScene } from "./scenes/IslandBootScene";
import { IslandPreloaderScene } from "./scenes/IslandPreloaderScene";
import { IslandScene } from "./scenes/IslandScene";
// Legacy scenes kept in tree for gradual migration
import { BootScene } from "./scenes/boot-scene";
import { MatchScene } from "./scenes/match-scene";
import { TowerScene } from "./scenes/TownScene";

/** Logical viewport 1280×720; Scale.FIT adapts to the React container / window. */
export const GAME_VIEWPORT = { width: BASE_WIDTH, height: BASE_HEIGHT } as const;

/**
 * Creates the Phaser game in `container` (React page with Phaser host).
 * Caller is responsible for `game.destroy(true)` on unmount.
 *
 * Default flow: IslandBoot → IslandPreloader → IslandScene (kleeblock port).
 * Legacy Town/Match remain registered for optional starts.
 */
export function createGame(container: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    backgroundColor: "#101810",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: false,
      roundPixels: true,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [
      IslandBootScene,
      IslandPreloaderScene,
      IslandScene,
      // legacy (not auto-started)
      BootScene,
      MatchScene,
      TowerScene,
    ],
  });
}
