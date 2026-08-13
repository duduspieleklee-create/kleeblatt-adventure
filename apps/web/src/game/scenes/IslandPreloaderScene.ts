import Phaser from "phaser";
import { UI_CONFIG, TEXT_STYLES } from "../ui/UIConstants";
import { log } from "../utils/logger";

export class IslandPreloaderScene extends Phaser.Scene {
  private errorText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private failedAssets: string[] = [];

  constructor() {
    super({ key: "IslandPreloaderScene" });
  }

  preload(): void {
    const { width, height } = this.scale.gameSize;
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);

    this.add
      .text(cx, cy - 80, "Kleeblatt Adventure", {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: "22px",
        color: "#f5e6c8",
      })
      .setOrigin(0.5);

    const bg = this.add.graphics();
    bg.fillStyle(0x2a2118, 0.9);
    bg.fillRoundedRect(cx - 160, cy - 20, 320, 28, 6);
    bg.lineStyle(2, 0x8b6914, 1);
    bg.strokeRoundedRect(cx - 160, cy - 20, 320, 28, 6);

    const bar = this.add.graphics();
    this.load.on("progress", (value: number) => {
      bar.clear();
      bar.fillStyle(0x00c878, 1);
      bar.fillRoundedRect(cx - 156, cy - 16, Math.max(4, 312 * value), 20, 4);
      this.statusText?.setText(`Loading… ${Math.round(value * 100)}%`);
    });

    this.statusText = this.add
      .text(cx, cy + 28, "Loading… 0%", {
        ...TEXT_STYLES.body,
        fontSize: "14px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.errorText = this.add
      .text(cx, cy + 56, "", {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: "11px",
        color: "#ff6b6b",
        align: "center",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      const assetKey = file.key || "unknown";
      this.failedAssets.push(assetKey);
      log.error(`[IslandPreloader] Asset load failed: ${assetKey}`);
      this.errorText?.setVisible(true);
      this.errorText?.setText(`Failed: ${assetKey}`);
    });

    this.time.addEvent({
      delay: 15_000,
      callback: () => {
        if (this.scene.isActive("IslandPreloaderScene")) {
          log.warn("[IslandPreloader] Timed out — starting island anyway");
          this.scene.start("IslandScene");
        }
      },
    });

    try {
      this.load.pack("game_assets", "assets/pack.json");
    } catch (e) {
      log.error("[IslandPreloader] Failed to load asset pack:", e);
    }
  }

  create(): void {
    if (this.failedAssets.length > 0) {
      log.warn("[IslandPreloader] failures:", this.failedAssets);
      this.errorText?.setVisible(true);
      this.errorText?.setText(
        `${this.failedAssets.length} asset(s) failed.\nContinuing in 2s…`,
      );
      this.time.delayedCall(2000, () => this.scene.start("IslandScene"));
    } else {
      log.debug("[IslandPreloader] All assets loaded");
      this.scene.start("IslandScene");
    }
  }
}
