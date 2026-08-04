/**
 * Asset-Loading-Pipeline (P5, Workboard #83).
 *
 * Ersetzt die Platzhalter-Generierung in der BootScene durch einen echten
 * Load-Pfad: asset-manifest.json → Phaser-Loader. Laufzeit-Texturen
 * (player, enemy_bruiser, tile_ground, tile_wall, chest) bekommen echte
 * Assets; schlägt ein Load fehl, greifen generierte Platzhalter, damit der
 * Prototyp nie an fehlenden Dateien hängt.
 *
 * Frame-Konventionen (aus docs/architecture/25-phaser-asset-guide.md + PNG-Inspektion):
 * - characters: Spritesheets, Frame 96x64 (Höhe variiert: 64/128/192 – 96 breit)
 * - alle anderen Kategorien: als Einzelbild laden (Strips bleiben bis zur
 *   Szenen-Integration (#84-#87) ganzheitliche Bilder)
 */

import Phaser from "phaser";

/** Struktur von apps/web/public/assets/asset-manifest.json */
export interface AssetManifest {
  root: string[];
  tilesets: string[];
  characters: string[];
  ui: string[];
  elements: string[];
  "elements/animals": string[];
  "elements/crops": string[];
  vfx: string[];
}

/** Kategorie → Verzeichnis relativ zu /assets. */
export const ASSET_DIRS: Record<string, string> = {
  root: "assets",
  tilesets: "assets/tilesets",
  characters: "assets/characters",
  ui: "assets/ui",
  elements: "assets/elements",
  "elements/animals": "assets/elements/animals",
  "elements/crops": "assets/elements/crops",
  vfx: "assets/vfx",
};

/** Frame-Größe der Character-Spritesheets (alle Sheets sind 96px breit je Frame). */
export const CHARACTER_FRAME = { frameWidth: 96, frameHeight: 64 } as const;

/** Dateiname → Phaser-Texture-Key (Extension entfernt, Slashes → "_"). */
export function getAssetKey(file: string): string {
  return file.replace(/\.[^.]+$/, "").replace(/\//g, "_");
}

/** Nur Character-Sheets werden als Spritesheet registriert (Frame 96x64). */
export function isCharacterSheet(category: string, file: string): boolean {
  return category === "characters" && file.includes("_strip");
}

/** Laufzeit-Texturen: Key → Asset (Spritesheet-Konfiguration optional). */
export interface RuntimeTexture {
  path: string;
  sheet?: { frameWidth: number; frameHeight: number; frameMax: number };
}

export const RUNTIME_TEXTURES: Record<string, RuntimeTexture> = {
  player: {
    path: "assets/characters/base_walk_strip8.png",
    sheet: { frameWidth: 96, frameHeight: 64, frameMax: 8 },
  },
  enemy_bruiser: {
    path: "assets/characters/skeleton_idle_strip6.png",
    sheet: { frameWidth: 96, frameHeight: 64, frameMax: 6 },
  },
  tile_ground: { path: "assets/tilesets/spr_tileset_sunnysideworld_16px.png" },
  tile_wall: { path: "assets/tilesets/spr_tileset_sunnysideworld_forest_32px.png" },
  chest: { path: "assets/elements/crops/crate_base.png" },
};

/**
 * Registriert alle Manifest-Assets beim Phaser-Loader.
 * Aufruf aus preload() – neue Dateien werden in derselben Load-Phase
 * nachgeladen (Loader arbeitet die Queue kontinuierlich ab).
 */
export function registerManifestAssets(scene: Phaser.Scene, manifest: AssetManifest): void {
  for (const [category, files] of Object.entries(manifest)) {
    const dir = ASSET_DIRS[category] ?? `assets/${category}`;
    for (const file of files) {
      const key = getAssetKey(file);
      const path = `${dir}/${file}`;
      if (isCharacterSheet(category, file)) {
        scene.load.spritesheet(key, path, { ...CHARACTER_FRAME });
      } else {
        scene.load.image(key, path);
      }
    }
  }
}

/** Registriert die von den Szenen genutzten Laufzeit-Texturen. */
export function registerRuntimeTextures(scene: Phaser.Scene): void {
  for (const [key, asset] of Object.entries(RUNTIME_TEXTURES)) {
    if (asset.sheet) {
      scene.load.spritesheet(key, asset.path, asset.sheet);
    } else {
      scene.load.image(key, asset.path);
    }
  }
}

/** Generiert Platzhalter-Texturen für Laufzeit-Keys, die nicht geladen wurden. */
export function ensureFallbackTextures(scene: Phaser.Scene): void {
  const graphics = scene.make.graphics({ x: 0, y: 0 });
  const placeholders: Record<string, { color: number; w: number; h: number }> = {
    player: { color: 0x00cc44, w: 32, h: 32 },
    enemy_bruiser: { color: 0xcc2222, w: 40, h: 40 },
    tile_ground: { color: 0x444444, w: 32, h: 32 },
    tile_wall: { color: 0x222222, w: 32, h: 32 },
    chest: { color: 0xccaa00, w: 28, h: 28 },
    projectile: { color: 0xffffff, w: 8, h: 8 },
  };
  for (const [key, cfg] of Object.entries(placeholders)) {
    if (scene.textures.exists(key)) continue;
    graphics.fillStyle(cfg.color, 1);
    graphics.fillRect(0, 0, cfg.w, cfg.h);
    graphics.generateTexture(key, cfg.w, cfg.h);
    graphics.clear();
    console.warn(`[asset-loader] Platzhalter für "${key}" generiert (Asset fehlt/failed).`);
  }
  graphics.destroy();
}

/** Ladebalken + Status-Text für die BootScene. */
export function setupLoadingProgress(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const barWidth = Math.min(360, width * 0.6);
  const barX = width / 2 - barWidth / 2;
  const barY = height / 2 + 20;

  scene.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
  scene.add
    .text(width / 2, height / 2 - 60, "Kleeblatt Adventure", {
      font: "28px system-ui, sans-serif",
      color: "#ffffff",
    })
    .setOrigin(0.5);
  scene.add
    .text(width / 2, height / 2 - 20, "Lade Assets...", {
      font: "16px system-ui, sans-serif",
      color: "#9aa0b4",
    })
    .setOrigin(0.5);

  scene.add.rectangle(barX, barY, barWidth, 18, 0x2a2a3e);
  const barFill = scene.add.rectangle(barX, barY, 4, 18, 0x00d9ff).setOrigin(0, 0.5);
  const progressText = scene.add
    .text(width / 2, barY + 26, "0%", { font: "14px system-ui, sans-serif", color: "#00d9ff" })
    .setOrigin(0.5);

  scene.load.on("progress", (value: number) => {
    const w = Math.max(4, Math.round(value * barWidth));
    barFill.width = w;
    progressText.setText(`${Math.round(value * 100)}%`);
  });
  scene.load.on("fileerror", (_key: string, _type: string, file: string) => {
    console.warn(`[asset-loader] Fehler beim Laden: ${file}`);
  });
}
