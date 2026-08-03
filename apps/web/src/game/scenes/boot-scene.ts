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
    // Scene vollständig geladen → Match bereit
    gameBridge.emit("match:started", { matchId: "proto-" + Date.now() });

    // Hinweis-Text (optional, zeigt dass Boot gelaufen ist)
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Assets geladen – Match startet", {
        fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
        fontSize: "20px",
        color: "#e8f0e8",
      })
      .setOrigin(0.5);

    // Nach kurzer Anzeige zur MatchScene wechseln (spätere Karte)
    // this.scene.start("match");
  }
}