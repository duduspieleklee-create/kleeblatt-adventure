import Phaser from "phaser";

export interface ParallaxLayerConfig {
  /** Texture key (must be loaded in BootScene). */
  key: string;
  /** Scroll factor 0..1 — smaller = farther (moves slower). */
  scrollFactor: number;
  /** Depth (negative = behind ground). */
  depth: number;
  /** Optional tint (hex). */
  tint?: number;
  /** Alpha 0..1. */
  alpha?: number;
  /** Scale of the repeated tile texture. */
  tileScale?: number;
}

export interface ParallaxBackgroundConfig {
  widthPx: number;
  heightPx: number;
  /** Override default layers. */
  layers?: ParallaxLayerConfig[];
}

export interface ParallaxBackgroundResult {
  layers: Phaser.GameObjects.TileSprite[];
  destroy: () => void;
}

/**
 * Default depth stack (far → near):
 *   sky/haze  scroll 0.15
 *   hills     scroll 0.35
 *   treeline  scroll 0.55
 * Ground (scroll 1.0) is created separately by createWorldMap.
 */
export const DEFAULT_PARALLAX_LAYERS: ParallaxLayerConfig[] = [
  {
    key: "tiles_16",
    scrollFactor: 0.12,
    depth: -30,
    tint: 0x6a8ab0,
    alpha: 0.9,
    tileScale: 4,
  },
  {
    key: "tiles_forest",
    scrollFactor: 0.35,
    depth: -20,
    tint: 0x3a5a4a,
    alpha: 0.55,
    tileScale: 2,
  },
  {
    key: "tiles_forest",
    scrollFactor: 0.55,
    depth: -10,
    tint: 0x2a4a32,
    alpha: 0.4,
    tileScale: 1.5,
  },
];

/**
 * Create multi-layer parallax backgrounds for a sense of depth.
 * Each layer is a TileSprite with scrollFactor < 1 so it lags behind the camera.
 *
 * Call after the camera has bounds set; works with startFollow.
 */
export function createParallaxBackground(
  scene: Phaser.Scene,
  config: ParallaxBackgroundConfig,
): ParallaxBackgroundResult {
  const { widthPx, heightPx } = config;
  const defs = config.layers ?? DEFAULT_PARALLAX_LAYERS;
  const layers: Phaser.GameObjects.TileSprite[] = [];

  // Slightly oversized so edges don't show when scrolling at low factors
  const pad = 1.15;
  const w = widthPx * pad;
  const h = heightPx * pad;

  for (const def of defs) {
    if (!scene.textures.exists(def.key)) {
      console.warn(`[parallax] missing texture "${def.key}", skipping layer`);
      continue;
    }

    const sprite = scene.add
      .tileSprite(widthPx / 2, heightPx / 2, w, h, def.key)
      .setOrigin(0.5, 0.5)
      .setDepth(def.depth)
      .setScrollFactor(def.scrollFactor, def.scrollFactor)
      .setAlpha(def.alpha ?? 1);

    if (def.tint !== undefined) {
      sprite.setTint(def.tint);
    }

    if (def.tileScale && def.tileScale !== 1) {
      sprite.setTileScale(def.tileScale, def.tileScale);
    }

    layers.push(sprite);
  }

  return {
    layers,
    destroy() {
      for (const layer of layers) layer.destroy();
      layers.length = 0;
    },
  };
}

/**
 * Optional: subtle vertical drift on far layers (clouds / haze).
 * Call once from scene.create(); returns a cleanup fn for shutdown.
 */
export function enableParallaxDrift(
  scene: Phaser.Scene,
  layers: Phaser.GameObjects.TileSprite[],
  speedPxPerSec = 8,
): () => void {
  if (layers.length === 0) return () => undefined;

  const far = layers[0]!;
  const onUpdate = (_time: number, delta: number) => {
    far.tilePositionX += (speedPxPerSec * delta) / 1000;
  };

  scene.events.on("update", onUpdate);
  return () => scene.events.off("update", onUpdate);
}
