import Phaser from "phaser";
import {
  ensureFallbackTextures,
  registerCharacterSheets,
  registerManifestAssets,
  registerRuntimeTextures,
  setupLoadingProgress,
  type AssetManifest,
} from "../asset-loader";

/**
 * BootScene – lädt echte Assets aus dem asset-manifest (P5, #83).
 *
 * Phase 1 (preload): Laufzeit-Texturen (player, enemy_bruiser, tile_ground,
 * tile_wall, chest) + asset-manifest.json, mit Ladebalken.
 * Phase 2 (create): alle Manifest-Assets + Charakter-Sheets nachladen
 * (der Loader verarbeitet die Queue sequenziell – neue Dateien während des
 * Ladens sind nicht erlaubt), dann Start der MatchScene.
 * Fallback: fehlende/failed Assets werden als Platzhalter-Texturen
 * generiert, damit der Prototyp nie an fehlenden Dateien hängt.
 */
export class BootScene extends Phaser.Scene {
  private manifest: AssetManifest | null = null;
  private assetsQueued = false;

  constructor() {
    super("boot");
  }

  preload(): void {
    setupLoadingProgress(this);
    registerRuntimeTextures(this);
    this.load.json("asset-manifest", "assets/asset-manifest.json");
  }

  create(): void {
    if (!this.manifest) {
      const cached = this.cache.json.get("asset-manifest") as AssetManifest | null;
      if (cached) this.manifest = cached;
    }

    // Phase 2: Manifest-Assets + Charakter-Sheets nachladen.
    if (this.manifest && !this.assetsQueued) {
      this.assetsQueued = true;
      registerManifestAssets(this, this.manifest);
      registerCharacterSheets(this);
      this.load.once("complete", () => this.startMatch());
      this.load.start();
      return;
    }

    this.startMatch();
  }

  private startMatch(): void {
    ensureFallbackTextures(this);
    this.scene.start("match");
  }
}
