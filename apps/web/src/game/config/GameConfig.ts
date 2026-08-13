/** Logical game resolution — build everything for this size; Scale.FIT handles windows. */
export const BASE_WIDTH = 1280;
export const BASE_HEIGHT = 720;

export const GAME_VIEWPORT = {
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
} as const;
