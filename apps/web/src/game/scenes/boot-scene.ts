import Phaser from "phaser";
import { gameBridge } from "@kleeblatt/shared";

/**
 * BootScene – lädt Platzhalter-Assets für den Prototyp (P4).
 * Nach Abschluss emittiert sie "match:started" via gameBridge,
 * damit React das HUD einblenden kann.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    // Einfache Platzhalter-Grafiken per Code generieren (keine externen Assets nötig)
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Spieler: grünes Quadrat (32x32)
    graphics.fillStyle(0x00cc44, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("player", 32, 32);
    graphics.clear();

    // Enemy (Bruiser): rotes Quadrat (40x40)
    graphics.fillStyle(0xcc2222, 1);
    graphics.fillRect(0, 0, 40, 40);
    graphics.generateTexture("enemy_bruiser", 40, 40);
    graphics.clear();

    // Tile (Boden): graues Quadrat (32x32)
    graphics.fillStyle(0x444444, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("tile_ground", 32, 32);
    graphics.clear();

    // Tile (Wand): dunkelgraues Quadrat (32x32)
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("tile_wall", 32, 32);
    graphics.clear();

    // Kiste: gelbes Quadrat (28x28)
    graphics.fillStyle(0xccaa00, 1);
    graphics.fillRect(0, 0, 28, 28);
    graphics.generateTexture("chest", 28, 28);
    graphics.clear();

    // Projectile (Basisangriff): kleines weißes Quadrat (8x8)
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 8, 8);
    graphics.generateTexture("projectile", 8, 8);
    graphics.destroy();
  }

  create(): void {
    this.scene.start("match");
  }
}
