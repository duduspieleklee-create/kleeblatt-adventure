// ============================================================
//  KORREKTE IMPORTS FÜR `src/scenes/boot-scene.ts`
// ============================================================

import Phaser from "phaser";
// KEINE Importe aus lib/ oder core/ – die BootScene ist eigenständig.

const CHAR_FRAME = { frameWidth: 96, frameHeight: 64 } as const;

function devLog(...args: unknown[]) {
  if (import.meta.env.DEV) console.info(...args);
}
function devWarn(...args: unknown[]) {
  if (import.meta.env.DEV) console.warn(...args);
}

function cropTileTexture(
  scene: Phaser.Scene,
  atlasKey: string,
  outKey: string,
  tileX: number,
  tileY: number,
  tileSize: number,
): void {
  if (scene.textures.exists(outKey)) return;
  const src = scene.textures.get(atlasKey).getSourceImage() as HTMLImageElement;
  if (!src || !(src instanceof HTMLImageElement)) return;

  const canvas = document.createElement("canvas");
  canvas.width = tileSize;
  canvas.height = tileSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(src, tileX * tileSize, tileY * tileSize, tileSize, tileSize, 0, 0, tileSize, tileSize);
  scene.textures.addCanvas(outKey, canvas);
  devLog(`[BootScene] cropped ${outKey} from ${atlasKey} tile(${tileX},${tileY})`);
}

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private detailText!: Phaser.GameObjects.Text;
  private progressBox!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private _loadErrors: string[] = [];
  private loadTotal = 0;
  private loadDone = 0;

  constructor() {
    super("boot");
  }

  preload(): void {
    const { width, height } = this.scale;
    const barWidth = Math.min(360, width * 0.55);
    const barX = (width - barWidth) / 2;
    const barY = height / 2 + 20;

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x1a221c, 0.85);
    this.progressBox.fillRoundedRect(barX, barY, barWidth, 20, 10);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add.text(width / 2, height / 2 - 40, "Lade Assets …", {
      fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
      fontSize: "18px",
      color: "#e8f0e8",
    }).setOrigin(0.5);

    this.detailText = this.add.text(width / 2, barY + 32, "", {
      fontFamily: "Cascadia Code, Fira Code, monospace",
      fontSize: "11px",
      color: "#8fa88f",
    }).setOrigin(0.5);

    // ============================================================
    //  ASSET-LISTE FÜR THE FANTASY TILESET (FREE VERSION)
    // ============================================================
    // 1. TILESETS (Atlas-Bilder)
    this.load.image('tiles_ground', 'assets/tilesets/ground_atlas.png');
    this.load.image('tiles_buildings', 'assets/tilesets/buildings_atlas.png');
    this.load.image('tiles_nature', 'assets/tilesets/nature_atlas.png');

    // 2. CHARACTER SPRITESHEETS
    this.load.spritesheet('hero_idle', 'assets/characters/hero_idle.png', CHAR_FRAME);
    this.load.spritesheet('hero_walk', 'assets/characters/hero_walk.png', CHAR_FRAME);

    // 3. GEGNER SPRITESHEETS
    this.load.spritesheet('skeleton_idle', 'assets/characters/skeleton_idle.png', CHAR_FRAME);
    this.load.spritesheet('skeleton_walk', 'assets/characters/skeleton_walk.png', CHAR_FRAME);

    // 4. DEKO-OBJEKTE
    this.load.image('tree_1', 'assets/objects/tree_1.png');
    this.load.image('bush_1', 'assets/objects/bush_1.png');
    this.load.image('crop_wheat', 'assets/objects/wheat.png');

    // 5. VFX
    this.load.spritesheet('vfx_dust', 'assets/vfx/dust.png', { frameWidth: 16, frameHeight: 16 });

    // 6. Progress-Events
    this.load.on("progress", (value: number) => {
      this.loadDone = Math.round(value * this.loadTotal);
      this.progressBar.clear();
      this.progressBar.fillStyle(0x3faf4a, 1);
      this.progressBar.fillRoundedRect(barX + 3, barY + 3, (barWidth - 6) * value, 14, 7);
      this.loadingText.setText(`Lade Assets … (${this.loadDone}/${this.loadTotal})`);
    });

    this.load.on("complete", () => {
      this.detailText.setText(`${this.loadDone}/${this.loadTotal} geladen`);
    });
  }

  // ============================================================
  //  DAS IST DIE CREATE()-METHODE – HIER KOMMT DER CODE REIN!
  // ============================================================
  create(): void {
    try {
      // Einzelne Tiles aus den Atlanten schneiden
      cropTileTexture(this, 'tiles_ground', 'grass_1', 0, 0, 16);
      cropTileTexture(this, 'tiles_ground', 'dirt_1', 1, 0, 16);
      cropTileTexture(this, 'tiles_nature', 'tree_1', 0, 0, 16);
      cropTileTexture(this, 'tiles_nature', 'bush_1', 1, 0, 16);

      // Fallback-Texturen für fehlende Assets
      const fallbacks = [
        { key: 'ground_tile', color: 0x3faf4a, size: 32 },
        { key: 'wall_tile', color: 0x8a8f94, size: 32 },
        { key: 'tree', color: 0x2f6f2f, size: 32 },
      ];
      for (const fb of fallbacks) {
        if (!this.textures.exists(fb.key)) {
          const g = this.make.graphics({ x: 0, y: 0 });
          g.fillStyle(fb.color, 1);
          g.fillRect(0, 0, fb.size, fb.size);
          g.generateTexture(fb.key, fb.size, fb.size);
          g.destroy();
          devWarn(`[BootScene] fallback generated for ${fb.key}`);
        }
      }

      // Animationen erstellen
      this.anims.create({
        key: "hero_idle",
        frames: this.anims.generateFrameNumbers("hero_idle", { start: 0, end: 8 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: "hero_walk",
        frames: this.anims.generateFrameNumbers("hero_walk", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: "skeleton_idle",
        frames: this.anims.generateFrameNumbers("skeleton_idle", { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: "skeleton_walk",
        frames: this.anims.generateFrameNumbers("skeleton_walk", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });

      devLog("[BootScene] all animations created, starting town scene");
      this.scene.start("town");
    } catch (e) {
      console.error(`[BootScene] create() CRASHED: ${e}`);
      this.add.text(20, 20, `Fehler: ${e}`, { color: '#ff4444', fontSize: '14px' });
    }
  }
                        }
