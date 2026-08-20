/**
 * Single source of truth for the logical game resolution.
 *
 * All gameplay and UI layout must use Phaser's logical game size
 * (this.scale.gameSize / cameras.main), not window.innerWidth/Height.
 *
 * See AI_CONTEXT.md and docs/development_game/development_plan.md Block 1.
 */
export const BASE_WIDTH = 1280;
export const BASE_HEIGHT = 720;

/**
 * Viewport constraints for the Phaser game canvas.
 *
 * The game is rendered in a 100vw/100vh container and uses Phaser.Scale.FIT.
 * These values define the smallest and largest logical resolutions the game
 * will scale to, and are also used by BootScene to gate unsupported sizes.
 */
export const MIN_GAME_WIDTH = 320;
export const MIN_GAME_HEIGHT = 320;
export const MAX_GAME_WIDTH = 3840;
export const MAX_GAME_HEIGHT = 2160;

/** Convenience object for the viewport constraints. */
export const VIEWPORT_CONSTRAINTS = {
  min: { width: MIN_GAME_WIDTH, height: MIN_GAME_HEIGHT },
  max: { width: MAX_GAME_WIDTH, height: MAX_GAME_HEIGHT },
} as const;
