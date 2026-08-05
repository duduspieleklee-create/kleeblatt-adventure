/**
 * Re-export the shared typed gameBridge so React and Phaser share one bus.
 * Do not create a second in-memory emitter here — persistence and MatchPage
 * already import from @kleeblatt/shared.
 */
export { gameBridge, TypedEmitter } from "@kleeblatt/shared";
export type { GameBridgeEvents } from "@kleeblatt/shared";
