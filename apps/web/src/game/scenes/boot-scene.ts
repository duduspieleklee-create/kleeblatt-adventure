import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBox!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super("boot");
  }

  preload(): void {
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x1a221c, 0.8);
    this.progressBox.fillRoundedRect(220, 260, 320, 24, 12);
    this.progressBar = this.add.graphics();

    this.loadingText = this.add.text(380, 235, "Lade Assets …", {
      fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
      fontSize: "16px",
      color: "#e8f0e8",
    }).setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x3faf4a, 1);
      this.progressBar.fillRoundedRect(226, 266, 288 * value, 12, 8);
    });

    this.load.on("complete", () => {
      this.progressBox.destroy();
      this.progressBar.destroy();
      this.loadingText.destroy();
    });

    this.load.image("tiles_buildings", "assets/tilesets/SUNNYSIDE_WORLD_BUILDINGS_V0.01.png");
    this.load.image("tiles_forest", "assets/tilesets/spr_tileset_sunnysideworld_forest_32px.png");
    this.load.image("tiles_16", "assets/tilesets/spr_tileset_sunnysideworld_16px.png");
    this.load.spritesheet("hero_idle", "assets/characters/base_idle_strip9.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("hero_walk", "assets/characters/base_walk_strip8.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("hero_run", "assets/characters/base_run_strip8.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("hero_attack", "assets/characters/base_attack_strip10.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("hero_hurt", "assets/characters/base_hurt_strip8.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("hero_death", "assets/characters/base_death_strip13.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("skeleton_idle", "assets/characters/skeleton_idle_strip6.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("skeleton_walk", "assets/characters/skeleton_walk_strip8.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("skeleton_attack", "assets/characters/skeleton_attack_strip7.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("skeleton_hurt", "assets/characters/skeleton_hurt_strip7.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("skeleton_death", "assets/characters/skeleton_death_strip10.png", { frameWidth: 64, frameHeight: 64 });
    this.load.image("crop_wheat", "assets/elements/crops/wheat_00.png");
    this.load.image("crop_carrot", "assets/elements/crops/carrot_00.png");
    this.load.image("crop_pumpkin", "assets/elements/crops/pumpkin_00.png");
    this.load.image("animal_cow", "assets/elements/animals/spr_deco_cow_strip4.png");
    this.load.image("animal_chicken", "assets/elements/animals/spr_deco_chicken_01_strip4.png");
    this.load.image("vfx_dust", "assets/vfx/dust_general_strip9.png");
    this.load.image("vfx_smoke", "assets/vfx/chimneysmoke_01_strip30.png");
  }

  create(): void {
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

    this.scene.start("match");
  }
}
