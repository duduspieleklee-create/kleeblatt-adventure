import Phaser from 'phaser';
import {
  BASE_WIDTH,
  BASE_HEIGHT,
  VIEWPORT_CONSTRAINTS,
} from '../config/GameConfig';
import { UI_CONFIG, TEXT_STYLES } from '../ui/UIConstants';

/**
 * BootScene
 *
 * First scene. Waits for GameFont (Milestone 3.2), validates viewport,
 * then advances to PreloaderScene.
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

    console.info('[Boot] Expected logical size:', BASE_WIDTH, '×', BASE_HEIGHT);
    console.info('[Boot] Logical game size:', this.scale.gameSize.width, '×', this.scale.gameSize.height);
    console.info('[Boot] Display size:', this.scale.displaySize.width, '×', this.scale.displaySize.height);
    console.info('[Boot] Canvas:', this.game.canvas?.width, '×', this.game.canvas?.height);
  }

  private checkLayout(): boolean {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (!Number.isFinite(w) || !Number.isFinite(h) || w === 0 || h === 0) {
      return false;
    }

    const { min, max } = VIEWPORT_CONSTRAINTS;
    const tooSmall = w < min.width || h < min.height;
    const tooLarge = w > max.width || h > max.height;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const landscape = isMobile && w > h;

    if (tooSmall || tooLarge || landscape) {
      this.showGateOverlay(tooSmall, tooLarge, landscape);
      return false;
    }

    return true;
  }

  private showGateOverlay(tooSmall: boolean, tooLarge: boolean, landscape: boolean): void {
    const { width, height } = this.scale.gameSize;
    const { min, max } = VIEWPORT_CONSTRAINTS;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(99999);

    const lines: string[] = [];
    if (tooSmall) {
      lines.push('This game needs at least');
      lines.push(`${min.width} × ${min.height} to play.`);
    }
    if (tooLarge) {
      lines.push('This game does not support displays');
      lines.push(`larger than ${max.width} × ${max.height}.`);
    }
    if (landscape) {
      lines.push('Please rotate your device');
      lines.push('to portrait mode.');
    }
    lines.push('');
    lines.push('Resize or rotate to continue.');

    this.add
      .text(Math.round(width / 2), Math.round(height / 2), lines.join('\n'), {
        ...TEXT_STYLES.body,
        fontSize: '18px',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(100000);

    this.scale.once('resize', () => {
      // Recreate gate on orientation/size change
      this.scene.restart();
    });
  }
}
