import Phaser from 'phaser';
import {
  VIEWPORT_CONSTRAINTS,
  ORIENTATION_LOCK,
  LANDSCAPE_GATE_MOBILE_ONLY,
} from '../config/GameConfig';
import { UI_CONFIG, TEXT_STYLES } from '../ui/UIConstants';

export type GameSize = { width: number; height: number };
export type Orientation = 'landscape' | 'portrait';

export type ResizeCallback = (size: GameSize) => void;
export type OrientationCallback = (orientation: Orientation) => void;

/**
 * Centralized scale / viewport / orientation manager for the Phaser game.
 *
 * Wraps Phaser's ScaleManager and provides a single place for:
 * - viewport size constraints
 * - orientation gating (landscape vs portrait)
 * - resize subscriptions
 * - camera-zoom helpers for fitting a world to the viewport
 *
 * The exported `scaleManager` instance is created by `createGame.ts` and
 * consumed by scenes that need to react to viewport changes.
 */
export class ScaleManager {
  private game?: Phaser.Game;
  private resizeListeners = new Set<ResizeCallback>();
  private orientationListeners = new Set<OrientationCallback>();

  private handleResize = (gameSize: Phaser.Structs.Size): void => {
    const size: GameSize = { width: gameSize.width, height: gameSize.height };
    this.resizeListeners.forEach((cb) => cb(size));
  };

  private handleOrientationChange = (): void => {
    const orientation = this.currentOrientation;
    this.orientationListeners.forEach((cb) => cb(orientation));
  };

  /**
   * Returns the Phaser scale config that should be used when creating the game.
   */
  getPhaserScaleConfig(): Phaser.Types.Core.ScaleConfig {
    return {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      expandParent: true,
      min: VIEWPORT_CONSTRAINTS.min,
      max: VIEWPORT_CONSTRAINTS.max,
    };
  }

  /**
   * Attach the manager to a running Phaser game.
   * Must be called once in `createGame.ts` immediately after `new Phaser.Game(...)`.
   */
  attach(game: Phaser.Game): void {
    this.detach();
    this.game = game;
    game.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    game.scale.on(Phaser.Scale.Events.ORIENTATION_CHANGE, this.handleOrientationChange, this);
  }

  /**
   * Detach from the Phaser game and remove all internal listeners.
   */
  detach(): void {
    if (!this.game) return;
    this.game.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.game.scale.off(Phaser.Scale.Events.ORIENTATION_CHANGE, this.handleOrientationChange, this);
    this.game = undefined;
    this.resizeListeners.clear();
    this.orientationListeners.clear();
  }

  /** Current logical game size from Phaser. */
  getGameSize(): GameSize {
    if (!this.game) return { width: 0, height: 0 };
    return {
      width: this.game.scale.gameSize.width,
      height: this.game.scale.gameSize.height,
    };
  }

  /** Current display/canvas size from Phaser. */
  getDisplaySize(): GameSize {
    if (!this.game) return { width: 0, height: 0 };
    return {
      width: this.game.scale.displaySize.width,
      height: this.game.scale.displaySize.height,
    };
  }

  /** True if the viewport is currently wider than it is tall. */
  get isLandscape(): boolean {
    if (!this.game) return false;
    return this.game.scale.isLandscape;
  }

  /** True if the viewport is currently taller than it is wide. */
  get isPortrait(): boolean {
    return !this.isLandscape;
  }

  private get currentOrientation(): Orientation {
    return this.isLandscape ? 'landscape' : 'portrait';
  }

  /**
   * True if the current orientation matches the configured orientation policy.
   * Desktop is exempted from the landscape gate when `LANDSCAPE_GATE_MOBILE_ONLY`
   * is enabled, because browser windows can be arbitrary sizes.
   */
  get isOrientationAllowed(): boolean {
    if (ORIENTATION_LOCK === 'auto') return true;
    if (LANDSCAPE_GATE_MOBILE_ONLY && !this.isMobile) return true;
    if (ORIENTATION_LOCK === 'landscape') return this.isLandscape;
    if (ORIENTATION_LOCK === 'portrait') return this.isPortrait;
    return true;
  }

  private get isMobile(): boolean {
    return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  }

  /**
   * True if the actual browser window size is inside the min/max viewport
   * constraints defined in `GameConfig.ts`.
   */
  get isSizeSupported(): boolean {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const { min, max } = VIEWPORT_CONSTRAINTS;
    return (
      Number.isFinite(w) &&
      Number.isFinite(h) &&
      w > 0 &&
      h > 0 &&
      w >= min.width &&
      h >= min.height &&
      w <= max.width &&
      h <= max.height
    );
  }

  /**
   * Subscribe to logical game-size changes.
   * Returns an unsubscribe function.
   */
  onResize(callback: ResizeCallback): () => void {
    this.resizeListeners.add(callback);
    return () => {
      this.resizeListeners.delete(callback);
    };
  }

  /**
   * Subscribe to orientation changes.
   * Returns an unsubscribe function.
   */
  onOrientationChange(callback: OrientationCallback): () => void {
    this.orientationListeners.add(callback);
    return () => {
      this.orientationListeners.delete(callback);
    };
  }

  /**
   * Zoom value that makes a world of the given pixel size cover the entire
   * logical viewport. Useful for camera setup so the world fills the screen.
   *
   * A square world on a 16:9 viewport will have its top/bottom cropped.
   */
  getCameraCoverZoom(worldWidth: number, worldHeight: number): number {
    const { width, height } = this.getGameSize();
    if (worldWidth <= 0 || worldHeight <= 0 || width <= 0 || height <= 0) {
      return 1;
    }
    return Math.max(width / worldWidth, height / worldHeight);
  }

  /**
   * Draw a size gate in the given scene and restart the scene when the window
   * is resized or the orientation changes.
   */
  showSizeGate(scene: Phaser.Scene): void {
    const { width, height } = scene.scale.gameSize;
    const { min, max } = VIEWPORT_CONSTRAINTS;

    const lines = [
      'Viewport size not supported',
      '',
      `Minimum: ${min.width} × ${min.height}`,
      `Maximum: ${max.width} × ${max.height}`,
      '',
      'Resize your browser to continue.',
    ];

    this.drawGateOverlay(scene, width, height, lines);
    this.scheduleGateRecheck(scene);
  }

  /**
   * Draw an orientation gate in the given scene and restart the scene when the
   * window is resized or the orientation changes.
   */
  showOrientationGate(scene: Phaser.Scene): void {
    const { width, height } = scene.scale.gameSize;

    const lines = [
      'Please rotate your device',
      'to landscape mode.',
      '',
      'The game is designed for landscape.',
    ];

    this.drawGateOverlay(scene, width, height, lines);
    this.scheduleGateRecheck(scene);
  }

  private drawGateOverlay(
    scene: Phaser.Scene,
    width: number,
    height: number,
    lines: string[],
  ): void {
    const overlay = scene.add.graphics();
    overlay.fillStyle(UI_CONFIG.GATE_BG ?? 0x000000, 0.9);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(99999);

    scene.add
      .text(Math.round(width / 2), Math.round(height / 2), lines.join('\n'), {
        ...TEXT_STYLES.body,
        fontSize: '18px',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(100000);
  }

  private scheduleGateRecheck(scene: Phaser.Scene): void {
    const restart = (): void => {
      scene.scene.restart();
    };
    scene.scale.once(Phaser.Scale.Events.RESIZE, restart);
    scene.scale.once(Phaser.Scale.Events.ORIENTATION_CHANGE, restart);
  }
}

/** Singleton instance used by the game. */
export const scaleManager = new ScaleManager();
