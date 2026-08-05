import Phaser from "phaser";

/** Default world size in pixels (not tiles). Safe for mobile. */
export const DEFAULT_WORLD_SIZE = { width: 2000, height: 2000 } as const;

export const DEFAULT_TILE_SIZE = 32;

/** Hard cap on tile columns/rows to prevent accidental 2000×2000 *tile* maps. */
const MAX_TILE_AXIS = 128;

export interface WorldMapConfig {
  /** World width in pixels. */
  widthPx: number;
  /** World height in pixels. */
  heightPx: number;
  tileSize?: number;
  /** Texture key for scrolling ground (BootScene: tiles_forest). */
  groundKey?: string;
  /** Texture key for wall tileset (BootScene: tiles_buildings). */
  wallTilesetKey?: string;
  /** If true, draw a 1-tile border wall + a few interior blockers. */
  borderWalls?: boolean;
}

export interface WorldMapResult {
  /** Pixel size of the world (may be snapped to tile grid). */
  widthPx: number;
  heightPx: number;
  tileSize: number;
  cols: number;
  rows: number;
  /** Optional tilemap used only for sparse collision walls. */
  map: Phaser.Tilemaps.Tilemap | null;
  wallLayer: Phaser.Tilemaps.TilemapLayer | null;
  ground: Phaser.GameObjects.TileSprite;
}

/**
 * Build a large scrolling world without filling millions of tiles.
 *
 * Ground: single TileSprite (GPU-friendly, scrolls with camera).
 * Walls: optional blank tilemap layer with border + sparse blockers only.
 */
export function createWorldMap(scene: Phaser.Scene, config: WorldMapConfig): WorldMapResult {
  const tileSize = config.tileSize ?? DEFAULT_TILE_SIZE;
  const groundKey = config.groundKey ?? "tiles_forest";
  const wallTilesetKey = config.wallTilesetKey ?? "tiles_buildings";
  const borderWalls = config.borderWalls ?? true;

  // Snap to tile grid; interpret input as pixels, never as tile counts.
  let cols = Math.max(1, Math.ceil(config.widthPx / tileSize));
  let rows = Math.max(1, Math.ceil(config.heightPx / tileSize));

  if (cols > MAX_TILE_AXIS || rows > MAX_TILE_AXIS) {
    console.warn(
      `[createWorldMap] tile grid ${cols}×${rows} exceeds ${MAX_TILE_AXIS}; clamping. ` +
        `Pass pixel sizes (e.g. 2000), not tile counts.`,
    );
    cols = Math.min(cols, MAX_TILE_AXIS);
    rows = Math.min(rows, MAX_TILE_AXIS);
  }

  const widthPx = cols * tileSize;
  const heightPx = rows * tileSize;

  // --- Ground: one TileSprite, scrolls with the world (scrollFactor 1) ---
  const ground = scene.add
    .tileSprite(widthPx / 2, heightPx / 2, widthPx, heightPx, groundKey)
    .setDepth(0)
    .setOrigin(0.5, 0.5);
  // Explicit: ground must move with the camera follow, not stay fixed like HUD.
  ground.setScrollFactor(1, 1);

  // Soft tint so the repeating tileset is less harsh
  ground.setTint(0xc8e0c0);

  let map: Phaser.Tilemaps.Tilemap | null = null;
  let wallLayer: Phaser.Tilemaps.TilemapLayer | null = null;

  if (borderWalls) {
    map = scene.make.tilemap({
      tileWidth: tileSize,
      tileHeight: tileSize,
      width: cols,
      height: rows,
    });

    const wallTileset = map.addTilesetImage(wallTilesetKey, wallTilesetKey, tileSize, tileSize, 0, 0);

    if (wallTileset) {
      wallLayer = map.createBlankLayer("walls", wallTileset, 0, 0);

      if (wallLayer) {
        // Border only — O(cols + rows), not O(cols * rows)
        for (let x = 0; x < cols; x++) {
          wallLayer.putTileAt(1, x, 0, false);
          wallLayer.putTileAt(1, x, rows - 1, false);
        }
        for (let y = 0; y < rows; y++) {
          wallLayer.putTileAt(1, 0, y, false);
          wallLayer.putTileAt(1, cols - 1, y, false);
        }

        // A few interior blockers (relative positions so they scale with map size)
        const blockers: Array<[number, number]> = [
          [Math.floor(cols * 0.25), Math.floor(rows * 0.33)],
          [Math.floor(cols * 0.25) + 1, Math.floor(rows * 0.33)],
          [Math.floor(cols * 0.5), Math.floor(rows * 0.5)],
          [Math.floor(cols * 0.75), Math.floor(rows * 0.2)],
          [Math.floor(cols * 0.75) + 1, Math.floor(rows * 0.2)],
        ];
        for (const [bx, by] of blockers) {
          if (bx > 0 && bx < cols - 1 && by > 0 && by < rows - 1) {
            wallLayer.putTileAt(1, bx, by, false);
          }
        }

        wallLayer.setCollision(1);
        wallLayer.setDepth(1);
      }
    }
  }

  scene.physics.world.setBounds(0, 0, widthPx, heightPx);

  return { widthPx, heightPx, tileSize, cols, rows, map, wallLayer, ground };
}
