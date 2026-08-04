/**
 * Character-Animationen (P5, Workboard #84).
 *
 * Definiert Animationen (idle/walk/run/attack/hurt/death) für Spieler
 * (base_*-Sheets) und Gegner (skeleton_*-Sheets). Jede Aktion hat ihr
 * eigenes Spritesheet – Phaser wechselt die Texture automatisch, wenn eine
 * Animation abgespielt wird, deren Frames aus einer anderen Texture kommen.
 *
 * Frame-Konvention: 96x64 (siehe asset-loader CHARACTER_FRAME).
 */

import Phaser from "phaser";

/** Animations-Keys je Charakter. */
export const CHARACTER_ANIMS = {
  player: {
    idle: "player-idle",
    walk: "player-walk",
    run: "player-run",
    attack: "player-attack",
    hurt: "player-hurt",
    death: "player-death",
  },
  skeleton: {
    idle: "skeleton-idle",
    walk: "skeleton-walk",
    attack: "skeleton-attack",
    hurt: "skeleton-hurt",
    death: "skeleton-death",
  },
} as const;

type AnimDef = readonly [
  animKey: string,
  textureKey: string,
  frames: number,
  frameRate: number,
  repeat?: number,
];

const ANIM_DEFS: AnimDef[] = [
  // Spieler (base_*-Sheets)
  [CHARACTER_ANIMS.player.idle, "player_idle", 9, 6, -1],
  [CHARACTER_ANIMS.player.walk, "player_walk", 8, 8, -1],
  [CHARACTER_ANIMS.player.run, "player_run", 8, 11, -1],
  [CHARACTER_ANIMS.player.attack, "player_attack", 10, 14, 0],
  [CHARACTER_ANIMS.player.hurt, "player_hurt", 8, 12, 0],
  [CHARACTER_ANIMS.player.death, "player_death", 13, 10, 0],
  // Skelett-Gegner
  [CHARACTER_ANIMS.skeleton.idle, "skeleton_idle", 6, 5, -1],
  [CHARACTER_ANIMS.skeleton.walk, "skeleton_walk", 8, 6, -1],
  [CHARACTER_ANIMS.skeleton.attack, "skeleton_attack", 7, 10, 0],
  [CHARACTER_ANIMS.skeleton.hurt, "skeleton_hurt", 7, 10, 0],
  [CHARACTER_ANIMS.skeleton.death, "skeleton_death", 10, 9, 0],
];

/**
 * Erstellt alle Character-Animationen. Fehlende Texturen werden übersprungen
 * (Platzhalter-Fallback bleibt dann ohne Animation, aber stabil).
 */
export function createCharacterAnimations(scene: Phaser.Scene): void {
  for (const [animKey, textureKey, frames, frameRate, repeat = 0] of ANIM_DEFS) {
    if (!scene.textures.exists(textureKey)) {
      console.warn(
        `[character-anims] Texture "${textureKey}" fehlt – Animation "${animKey}" übersprungen.`,
      );
      continue;
    }
    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNumbers(textureKey, { start: 0, end: frames - 1 }),
      frameRate,
      repeat,
    });
  }
}
