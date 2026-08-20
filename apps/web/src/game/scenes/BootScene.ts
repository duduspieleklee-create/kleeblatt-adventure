import Phaser from 'phaser';
import { scaleManager } from '../managers/ScaleManager';
import { UI_CONFIG } from '../ui/UIConstants';

/**
 * BootScene
 *
 * First scene. Waits for GameFont (Milestone 3.2), validates viewport
 * via the shared ScaleManager, then advances to PreloaderScene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.logScaleDimensions();

    void this.bootSequence();
  }

  private async bootSequence(): Promise<void> {
    await this.waitForFonts();

    if (this.checkLayout()) {
      this.scene.start('PreloaderScene');
    }
  }

  /** Milestone 3.2 — avoid layout jump from late font load. */
  private async waitForFonts(): Promise<void> {
    try {
      if (typeof document !== 'undefined' && document.fonts) {
        // Explicitly request the game face so we do not proceed on fallback metrics only.
        await document.fonts.load(`16px ${UI_CONFIG.FONT_FAMILY}`);
        await document.fonts.ready;

        if (import.meta.env.DEV) {
          const loaded = document.fonts.check(`16px GameFont`);
          console.info('[Boot] GameFont ready:', loaded);
        }
      }
    } catch (err) {
      console.warn('[Boot] Font wait failed; continuing with fallback metrics', err);
    }
  }

  private logScaleDimensions(): void {
    if (!import.meta.env.DEV) return;

    const logical = scaleManager.getGameSize();
    const display = scaleManager.getDisplaySize();
    console.info('[Boot] Logical game size:', logical.width, '×', logical.height);
    console.info('[Boot] Display size:', display.width, '×', display.height);
    console.info('[Boot] Canvas:', this.game.canvas?.width, '×', this.game.canvas?.height);
    console.info('[Boot] Orientation:', scaleManager.isLandscape ? 'landscape' : 'portrait');
  }

  /**
   * Validate viewport size and orientation through the ScaleManager.
   * If invalid, the ScaleManager draws the appropriate gate overlay and the
   * scene will restart automatically when the viewport becomes valid.
   */
  private checkLayout(): boolean {
    if (!scaleManager.isSizeSupported) {
      scaleManager.showSizeGate(this);
      return false;
    }

    if (!scaleManager.isOrientationAllowed) {
      scaleManager.showOrientationGate(this);
      return false;
    }

    return true;
  }
}
