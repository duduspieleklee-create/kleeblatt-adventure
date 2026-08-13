import Phaser from "phaser";
import { BootScene } from "./scenes/boot-scene";
import { MatchScene } from "./scenes/match-scene";
import { TownScene } from "./scenes/TownScene";
import { BASE_WIDTH, BASE_HEIGHT } from "./config/GameConfig";

/** Logical viewport 1280×720; Scale.FIT adapts to the React container / window. */
export const GAME_VIEWPORT = { width: BASE_WIDTH, height: BASE_HEIGHT } as const;

/**
 * Creates the Phaser game in `container` (React page with Phaser host).
 * Caller is responsible for `game.destroy(true)` on unmount.
 *
 * Island / kleeblock scenes will replace or sit beside legacy Town/Match
 * as the port continues (see docs/architecture/28-kleeblock-port-plan.md).
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
    // Legacy scenes until IslandScene port is wired in
    scene: [BootScene, MatchScene, TownScene],
  });
}
