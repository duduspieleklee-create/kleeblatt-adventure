import Phaser from "phaser";

/** SunnySide character spritesheets: 96px wide per frame, 64px high. */
const CHAR_FRAME = { frameWidth: 96, frameHeight: 64 } as const;

/** Dev-only logging helper. */
function devLog(...args: unknown[]) {
  if (import.meta.env.DEV) console.info(...args);
}
function devWarn(...args: unknown[]) {
  if (import.meta.env.DEV) console.warn(...args);
}

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private detailText!: Phaser.GameObjects.Text;
  private progressBox!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private loadErrors: string[] = [];
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

    const allFiles = [
      "tiles_buildings", "tiles_forest", "tiles_16",
      "hero_idle", "hero_walk", "hero_run", "hero_attack", "hero_hurt", "hero_death",
      "skeleton_idle", "skeleton_walk", "skeleton_attack", "skeleton_hurt", "skeleton_death",
      "crop_wheat", "crop_carrot", "crop_pumpkin",
      "animal_cow", "animal_chicken",
      "vfx_dust", "vfx_smoke",
    ];
    this.loadTotal = allFiles.length;

    this.load.on("progress", (value: number) => {
      this.loadDone = Math.round(value * this.loadTotal);
      this.progressBar.clear();
      this.progressBar.fillStyle(0x3faf4a, 1);
      this.progressBar.fillRoundedRect(barX + 3, barY + 3, (barWidth - 6) * value, 14, 7);
      this.loadingText.setText(`Lade Assets … (${this.loadDone}/${this.loadTotal})`);
    });

    this.load.on("filecomplete", (key: string, _fileType: string) => {
      this.detailText.setText(`✓ ${key}`);
      this.detailText.setColor("#8fa88f");
      devLog(`[BootScene] loaded ${key} (${this.loadDone}/${this.loadTotal})`);
    });

    this.load.on("loaderror", (_file: Phaser.Loader.File, _key: string, _frame: string, xhr: unknown) => {
      const key = _key || _file?.key || "unknown";
      this.loadErrors.push(key);
      this.detailText.setText(`✗ ${key} (FEHLGESCHLAGEN)`);
      this.detailText.setColor("#ff4444");
      console.error(`[BootScene] FAILED: ${key}`, xhr);
    });

    this.load.on("complete", () => {
      this.detailText.setColor("#8fa88f");
      this.detailText.setText(`${this.loadDone}/${this.loadTotal} geladen${this.loadErrors.length ? ` · ${this.loadErrors.length} Fehler` : ""}`);
    });

    // Tilesets (single images)
    this.load.image("tiles_buildings", "assets/tilesets/SUNNYSIDE_WORLD_BUILDINGS_V0.01.png");
    this.load.image("tiles_forest", "assets/tilesets/spr_tileset_sunnysideworld_forest_32px.png");
    this.load.image("tiles_16", "assets/tilesets/spr_tileset_sunnysideworld_16px.png");

    // Character spritesheets — 96×64 frames (SunnySide convention)
    this.load.spritesheet("hero_idle", "assets/characters/base_idle_strip9.png", CHAR_FRAME);
    this.load.spritesheet("hero_walk", "assets/characters/base_walk_strip8.png", CHAR_FRAME);
    this.load.spritesheet("hero_run", "assets/characters/base_run_strip8.png", CHAR_FRAME);
    this.load.spritesheet("hero_attack", "assets/characters/base_attack_strip10.png", CHAR_FRAME);
    this.load.spritesheet("hero_hurt", "assets/characters/base_hurt_strip8.png", CHAR_FRAME);
    this.load.spritesheet("hero_death", "assets/characters/base_death_strip13.png", CHAR_FRAME);

    this.load.spritesheet("skeleton_idle", "assets/characters/skeleton_idle_strip6.png", CHAR_FRAME);
    this.load.spritesheet("skeleton_walk", "assets/characters/skeleton_walk_strip8.png", CHAR_FRAME);
    this.load.spritesheet("skeleton_attack", "assets/characters/skeleton_attack_strip7.png", CHAR_FRAME);
    this.load.spritesheet("skeleton_hurt", "assets/characters/skeleton_hurt_strip7.png", CHAR_FRAME);
    this.load.spritesheet("skeleton_death", "assets/characters/skeleton_death_strip10.png", CHAR_FRAME);

    // Elements (single images — use final growth stage, not seeds)
    this.load.image("crop_wheat", "assets/elements/crops/wheat_05.png");
    this.load.image("crop_carrot", "assets/elements/crops/carrot_05.png");
    this.load.image("crop_pumpkin", "assets/elements/crops/pumpkin_05.png");

    // Animals — spritesheets with 4 frames of 32×32 each
    this.load.spritesheet("animal_cow", "assets/elements/animals/spr_deco_cow_strip4.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("animal_chicken", "assets/elements/animals/spr_deco_chicken_01_strip4.png", { frameWidth: 32, frameHeight: 32 });

    // VFX — spritesheets (dust: 9 frames of 21×9, smoke: 30 frames of 15×37)
    this.load.spritesheet("vfx_dust", "assets/vfx/dust_general_strip9.png", { frameWidth: 21, frameHeight: 9 });
    this.load.spritesheet("vfx_smoke", "assets/vfx/chimneysmoke_01_strip30.png", { frameWidth: 15, frameHeight: 37 });
  }

  create(): void {
    try {
      devLog("[BootScene] create() started");

      if (this.loadErrors.length) {
        console.error(
          `[BootScene] ${this.loadErrors.length} assets failed: ${this.loadErrors.join(", ")}`,
        );
      }

      // Generate fallback textures for missing character spritesheets
      const charFallbacks = [
        "hero_idle", "hero_walk", "hero_run", "hero_attack", "hero_hurt", "hero_death",
        "skeleton_idle", "skeleton_walk", "skeleton_attack", "skeleton_hurt", "skeleton_death",
      ];
      for (const key of charFallbacks) {
        if (!this.textures.exists(key)) {
          const g = this.make.graphics({ x: 0, y: 0 });
          g.fillStyle(0xffffff, 1);
          g.fillRect(0, 0, 96, 64);
          g.generateTexture(key, 96, 64);
          g.destroy();
          devWarn(`[BootScene] fallback generated for ${key}`);
        }
      }

      // Generate fallback for missing tilesets
      const tileFallbacks: Array<{ key: string; w: number; h: number; color: number }> = [
        { key: "tiles_buildings", w: 32, h: 32, color: 0x5a3a1a },
        { key: "tiles_forest", w: 32, h: 32, color: 0x2a5a2a },
        { key: "tiles_16", w: 16, h: 16, color: 0x444444 },
      ];
      for (const t of tileFallbacks) {
        if (!this.textures.exists(t.key)) {
          const g = this.make.graphics({ x: 0, y: 0 });
          g.fillStyle(t.color, 1);
          g.fillRect(0, 0, t.w, t.h);
          g.generateTexture(t.key, t.w, t.h);
          g.destroy();
          devWarn(`[BootScene] fallback generated for ${t.key}`);
        }
      }

      // Generate fallback for missing elements
      const elFallbacks = [
        "crop_wheat", "crop_carrot", "crop_pumpkin",
        "animal_cow", "animal_chicken",
        "vfx_dust", "vfx_smoke",
      ];
      for (const key of elFallbacks) {
        if (!this.textures.exists(key)) {
          const g = this.make.graphics({ x: 0, y: 0 });
          g.fillStyle(0x888888, 1);
          g.fillRect(0, 0, 32, 32);
          g.generateTexture(key, 32, 32);
          g.destroy();
          devWarn(`[BootScene] fallback generated for ${key}`);
        }
      }

      devLog("[BootScene] creating animations");
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
        key: "hero_run",
        frames: this.anims.generateFrameNumbers("hero_run", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });
      this.anims.create({
        key: "hero_attack",
        frames: this.anims.generateFrameNumbers("hero_attack", { start: 0, end: 9 }),
        frameRate: 14,
        repeat: 0,
      });
      this.anims.create({
        key: "hero_hurt",
        frames: this.anims.generateFrameNumbers("hero_hurt", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: 0,
      });
      this.anims.create({
        key: "hero_death",
        frames: this.anims.generateFrameNumbers("hero_death", { start: 0, end: 12 }),
        frameRate: 10,
        repeat: 0,
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
      this.anims.create({
        key: "skeleton_attack",
        frames: this.anims.generateFrameNumbers("skeleton_attack", { start: 0, end: 6 }),
        frameRate: 12,
        repeat: 0,
      });
      this.anims.create({
        key: "skeleton_hurt",
        frames: this.anims.generateFrameNumbers("skeleton_hurt", { start: 0, end: 6 }),
        frameRate: 10,
        repeat: 0,
      });
      this.anims.create({
        key: "skeleton_death",
        frames: this.anims.generateFrameNumbers("skeleton_death", { start: 0, end: 9 }),
        frameRate: 10,
        repeat: 0,
      });

      devLog("[BootScene] all animations created, starting match scene");
      this.scene.start("match");
    } catch (e) {
      console.error(`[BootScene] create() CRASHED: ${e}`);
    }
  }
}