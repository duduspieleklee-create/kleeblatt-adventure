import Phaser from "phaser";
import { gameBridge } from "@kleeblatt/shared";
import {
  BASE_WIDTH,
  BASE_HEIGHT,
} from "./config/GameConfig";
import { scaleManager } from "./managers/ScaleManager";
import { BootScene } from "./scenes/BootScene";
import { PreloaderScene } from "./scenes/PreloaderScene";
import { LoginScene } from "./scenes/LoginScene";
import { CharacterCreationScene } from "./scenes/CharacterCreationScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { IslandScene } from "./scenes/IslandScene";
import { UIScene } from "./scenes/UIScene";

// Always keep fatal hooks; verbose stack only needed in DEV
window.onerror = (msg, _src, _line, _col, err) => {
  console.error("GLOBAL ERROR:", msg, import.meta.env.DEV ? err?.stack : undefined);
};
window.onunhandledrejection = (ev) => {
  console.error("UNHANDLED REJECTION:", ev.reason);
};

export function createGame(container: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    parent: container,
    backgroundColor: "#000000",
    dom: {
      createContainer: true,
    },
    scale: scaleManager.getPhaserScaleConfig(),
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
    scene: [BootScene, PreloaderScene, LoginScene, CharacterCreationScene, MainMenuScene, IslandScene, UIScene],
  };

  const game = new Phaser.Game(config);

  // Attach the dynamic scale manager before any scene runs.
  scaleManager.attach(game);

  // Wire shared bridge: pause/resume control the main game scene
  const onPause = (): void => {
    game.scene.pause("IslandScene");
  };
  const onResume = (): void => {
    game.scene.resume("IslandScene");
  };
  const onLogout = (): void => {
    // Return to the login gate so the player sees the login UI after the
    // React shell logs the session out. Stop any scene that might be active.
    game.scene.stop("UIScene");
    game.scene.stop("IslandScene");
    game.scene.stop("MainMenuScene");
    game.scene.stop("CharacterCreationScene");
    game.scene.stop("PreloaderScene");
    game.scene.stop("BootScene");
    game.scene.stop("LoginScene");
    game.scene.start("LoginScene");
  };
  gameBridge.on("pause", onPause);
  gameBridge.on("resume", onResume);
  gameBridge.on("logout", onLogout);

  // Clean up bridge listeners when the game is destroyed
  game.events.once(Phaser.Core.Events.DESTROY, () => {
    gameBridge.off("pause", onPause);
    gameBridge.off("resume", onResume);
    gameBridge.off("logout", onLogout);
    scaleManager.detach();
  });

  if (import.meta.env.DEV) {
    (window as unknown as { __PHASER_GAME__?: Phaser.Game }).__PHASER_GAME__ = game;
  }

  return game;
}
