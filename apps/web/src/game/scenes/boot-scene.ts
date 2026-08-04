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
  }

  create(): void {
    this.scene.start("match");
  }
}
