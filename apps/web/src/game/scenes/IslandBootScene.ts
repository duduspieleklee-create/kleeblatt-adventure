import Phaser from "phaser";
import { BASE_WIDTH, BASE_HEIGHT } from "../config/GameConfig";
import { UI_CONFIG, TEXT_STYLES } from "../ui/UIConstants";

const MIN_VIEWPORT = 320;

/** First scene for the kleeblock island flow. */
export class IslandBootScene extends Phaser.Scene {
  constructor() {
    super({ key: "IslandBootScene" });
  }

  create(): void {
    if (import.meta.env.DEV) {
      console.log("[IslandBoot] logical", BASE_WIDTH, "×", BASE_HEIGHT);
      console.log("[IslandBoot] gameSize", this.scale.gameSize.width, this.scale.gameSize.height);
    }
    void this.bootSequence();
  }

  private async bootSequence(): Promise<void> {
    await this.waitForFonts();
    if (this.checkLayout()) {
      this.scene.start("IslandPreloaderScene");
    }
  }

  private async waitForFonts(): Promise<void> {
    try {
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.load(`16px ${UI_CONFIG.FONT_FAMILY}`);
        await document.fonts.ready;
      }
    } catch (err) {
      console.warn("[IslandBoot] Font wait failed", err);
    }
  }

  private checkLayout(): boolean {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!Number.isFinite(w) || !Number.isFinite(h) || w === 0 || h === 0) return false;

    const tooSmall = Math.min(w, h) < MIN_VIEWPORT;
    if (tooSmall) {
      this.showGate();
      return false;
    }
    return true;
  }

  private showGate(): void {
    const { width, height } = this.scale.gameSize;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0).setDepth(99999);
    this.add
      .text(
        Math.round(width / 2),
        Math.round(height / 2),
        "Fenster zu klein.\nMindestens 320×320.\nResize to continue.",
        { ...TEXT_STYLES.body, fontSize: "18px", align: "center", lineSpacing: 8 },
      )
      .setOrigin(0.5)
      .setDepth(100000);

    this.scale.once("resize", () => this.scene.restart());
  }
}
