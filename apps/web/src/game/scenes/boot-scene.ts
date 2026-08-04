import Phaser from "phaser";

/**
 * BootScene – lädt Platzhalter-Assets für den Prototyp (P4).
 * Nach Abschluss emittiert sie "match:started" via gameBridge,
 * damit React das HUD einblenden kann.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0x00cc44, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("player", 32, 32);
    graphics.clear();

    graphics.fillStyle(0xcc2222, 1);
    graphics.fillRect(0, 0, 40, 40);
    graphics.generateTexture("enemy_bruiser", 40, 40);
    graphics.clear();

    graphics.fillStyle(0x444444, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("tile_ground", 32, 32);
    graphics.clear();

    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("tile_wall", 32, 32);
    graphics.clear();

    graphics.fillStyle(0xccaa00, 1);
    graphics.fillRect(0, 0, 28, 28);
    graphics.generateTexture("chest", 28, 28);
    graphics.clear();

    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 8, 8);
    graphics.generateTexture("projectile", 8, 8);
    graphics.destroy();

    this.load.image("crop_wheat", "assets/elements/crops/wheat_00.png");
    this.load.image("crop_carrot", "assets/elements/crops/carrot_00.png");
    this.load.image("crop_pumpkin", "assets/elements/crops/pumpkin_00.png");
    this.load.image("animal_cow", "assets/elements/animals/spr_deco_cow_strip4.png");
    this.load.image("animal_chicken", "assets/elements/animals/spr_deco_chicken_01_strip4.png");
    this.load.image("vfx_dust", "assets/vfx/dust_general_strip9.png");
    this.load.image("vfx_smoke", "assets/vfx/chimneysmoke_01_strip30.png");
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
