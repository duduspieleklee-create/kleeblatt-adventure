import Phaser from "phaser";

/**
 * Platzhalter-Scene der Match-Shell (P4).
 * BootScene / MatchScene folgen in eigenen Karten – hier nur der
 * sichtbare Beweis, dass der Phaser-Container läuft.
 */
export class PlaceholderScene extends Phaser.Scene {
  constructor() {
    super("placeholder");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#101810");

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Match-Shell bereit (P4)", {
        fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
        fontSize: "28px",
        color: "#e8f0e8",
      })
      .setOrigin(0.5);
  }
}
