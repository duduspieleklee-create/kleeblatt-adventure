import Phaser from "phaser";
import { gameBridge, type GameBridgeEvents } from "@kleeblatt/shared";

export class MatchScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private map!: Phaser.Tilemaps.Tilemap;
  private wallLayer!: Phaser.Tilemaps.TilemapLayer;

  private stats = {
    maxHp: 120,
    currentHp: 120,
    maxMana: 80,
    currentMana: 80,
    maxStamina: 100,
    currentStamina: 100,
    atk: 10,
    speed: 180,
    level: 1,
    xp: 0,
    xpToNext: 100,
  };

  private matchId: string;
  private matchStarted = false;
  private readonly pauseHandler = () => this.scene.pause();
  private readonly resumeHandler = () => this.scene.resume();
  private readonly matchExitHandler = () => this.onMatchExit();
  private readonly matchStartHandler = this.onMatchStart.bind(this);
  private readonly loadoutUpdateHandler = this.onLoadoutUpdate.bind(this);
  private vfxZones: Array<{ x: number; y: number; radius: number; key: string }> = [];
  private enemy!: Phaser.Physics.Arcade.Sprite;
  private villageZone = { x: 320, y: 240, width: 320, height: 240 };
  private landmarks: Array<{ label: string; x: number; y: number }> = [];
  private npcs: Array<{ label: string; x: number; y: number }> = [];

  constructor() {
    super("match");
    this.matchId = "proto-" + Date.now();
  }

  create(): void {
    this.createMap();
    this.createVillage();
    this.createPlayer();
    this.createSkeleton();
    this.createCrops();
    this.createAnimals();
    this.createVfxTriggers();
    this.setupInput();
    this.setupCamera();
    this.setupCollisions();
    this.setupGameBridge();
  }

  private createVillage(): void {
    const zone = this.villageZone;

    this.add.rectangle(zone.x + zone.width / 2, zone.y + zone.height / 2, zone.width, zone.height, 0x2a4a2e, 0.25)
      .setDepth(0).setScrollFactor(0);

    this.add.text(zone.x + zone.width / 2, zone.y - 15, "Willkommen-Dorf", {
      fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
      fontSize: "18px",
      color: "#88ff88",
    }).setOrigin(0.5).setDepth(2);

    this.add.text(zone.x + zone.width / 2, zone.y + zone.height + 15, "Sicherer Bereich", {
      fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
      fontSize: "12px",
      color: "#8fa88f",
    }).setOrigin(0.5).setDepth(2);

    this.landmarks = [
      { label: "Rathaus", x: 400, y: 200 },
      { label: "Taverne", x: 560, y: 200 },
      { label: "Lagerfeuer", x: 480, y: 360 },
    ];

    this.npcs = [
      { label: "Auftraggeber", x: 420, y: 260 },
      { label: "Händler", x: 540, y: 260 },
    ];

    for (const lm of this.landmarks) {
      this.add.rectangle(lm.x, lm.y, 40, 40, 0x5a3a1a, 0.8).setDepth(1);
      this.add.text(lm.x, lm.y - 25, lm.label, {
        fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
        fontSize: "11px",
        color: "#e8f0e8",
      }).setOrigin(0.5).setDepth(2);
    }

    for (const npc of this.npcs) {
      this.add.circle(npc.x, npc.y, 12, 0x88cc44, 0.9).setDepth(1);
      this.add.text(npc.x, npc.y - 20, npc.label, {
        fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
        fontSize: "10px",
        color: "#ffcc44",
      }).setOrigin(0.5).setDepth(2);
    }
  }

  private createSkeleton(): void {
    this.enemy = this.physics.add.sprite(800, 400, "skeleton_idle");
    this.enemy.setCollideWorldBounds(true);
    this.enemy.setDepth(10);
    this.enemy.play("skeleton_idle");
  }

  private createMap(): void {
    const width = 40;
    const height = 30;
    const tileSize = 32;

    this.map = this.make.tilemap({ tileWidth: tileSize, tileHeight: tileSize, width, height });

    const forestTileset = this.map.addTilesetImage("forest", "tiles_forest", tileSize, tileSize, 0, 0);
    const buildingTileset = this.map.addTilesetImage("buildings", "tiles_buildings", tileSize, tileSize, 0, 0);
    const smallTileset = this.map.addTilesetImage("ui16", "tiles_16", 16, 16, 0, 0);

    if (forestTileset) {
      const groundLayer = this.map.createBlankLayer("ground", forestTileset, 0, 0);
      if (groundLayer) {
      }
    }

    if (buildingTileset) {
      const wallLayer = this.map.createBlankLayer("walls", buildingTileset, 0, 0);
      if (wallLayer) {
        this.wallLayer = wallLayer;
        for (let x = 0; x < width; x++) {
          this.wallLayer.putTileAt(1, x, 0, true);
          this.wallLayer.putTileAt(1, x, height - 1, true);
        }
        for (let y = 0; y < height; y++) {
          this.wallLayer.putTileAt(1, 0, y, true);
          this.wallLayer.putTileAt(1, width - 1, y, true);
        }
        this.wallLayer.putTileAt(1, 10, 10, true);
        this.wallLayer.putTileAt(1, 11, 10, true);
        this.wallLayer.putTileAt(1, 20, 15, true);
        this.wallLayer.putTileAt(1, 21, 15, true);
        this.wallLayer.putTileAt(1, 30, 5, true);
        this.wallLayer.setCollision(1);
      }
    }

    if (smallTileset) {
      this.add.image(120, 120, "tiles_16").setDisplaySize(32, 32).setDepth(0);
      this.add.image(800, 100, "tiles_16").setDisplaySize(32, 32).setDepth(0);
    }
  }

  private createPlayer(): void {
    const startX = 640;
    const startY = 480;

    this.player = this.physics.add.sprite(startX, startY, "hero_idle");
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.play("hero_idle");
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setZoom(1);
  }

  private setupCollisions(): void {
    if (this.wallLayer) {
      this.physics.add.collider(this.player, this.wallLayer);
    }
  }

  private setupGameBridge(): void {
    gameBridge.on("match:start", this.matchStartHandler);
    gameBridge.on("loadout:update", this.loadoutUpdateHandler);
    gameBridge.on("pause", this.pauseHandler);
    gameBridge.on("resume", this.resumeHandler);
    gameBridge.on("match:exit", this.matchExitHandler);
  }

  private createCrops(): void {
    const crops = [
      { x: 200, y: 200, key: "crop_wheat" },
      { x: 240, y: 200, key: "crop_wheat" },
      { x: 200, y: 240, key: "crop_carrot" },
      { x: 400, y: 300, key: "crop_pumpkin" },
    ];

    for (const crop of crops) {
      this.add.image(crop.x, crop.y, crop.key).setDepth(1);
    }
  }

  private createAnimals(): void {
    const animals = [
      { x: 700, y: 300, key: "animal_cow" },
      { x: 750, y: 320, key: "animal_chicken" },
    ];

    for (const animal of animals) {
      this.add.image(animal.x, animal.y, animal.key).setDepth(1);
    }
  }

  private createVfxTriggers(): void {
    this.vfxZones = [
      { x: 500, y: 500, radius: 80, key: "vfx_dust" },
      { x: 900, y: 200, radius: 60, key: "vfx_smoke" },
    ];
  }

  private maybeSpawnVfx(x: number, y: number): void {
    if (!this.vfxZones) return;
    for (const zone of this.vfxZones) {
      const dx = x - zone.x;
      const dy = y - zone.y;
      if (dx * dx + dy * dy <= zone.radius * zone.radius) {
        const emitter = this.add.particles(zone.x, zone.y, zone.key, {
          speed: { min: 10, max: 30 },
          lifespan: 600,
          quantity: 1,
          scale: { start: 1, end: 0 },
          alpha: { start: 0.6, end: 0 },
          emitting: false,
        });
        emitter.explode(8);
      }
    }
  }

  private onMatchStart(payload: GameBridgeEvents["match:start"]): void {
    this.stats.level = payload.level;
    Object.assign(this.stats, payload.equippedStats);
    this.matchId = "proto-" + Date.now();
    this.matchStarted = true;
    gameBridge.emit("match:started", { matchId: this.matchId });
    this.emitInitialStats();
  }

  private onLoadoutUpdate(payload: GameBridgeEvents["loadout:update"]): void {
    Object.assign(this.stats, payload.equippedStats);
    this.emitInitialStats();
  }

  private onMatchExit(): void {
    this.matchStarted = false;
    this.scene.stop();
    gameBridge.emit("match:ended", {
      matchId: this.matchId,
      enemiesKilled: 0,
      chestsOpened: 0,
    });
  }

  private emitInitialStats(): void {
    gameBridge.emit("player:hp", { current: this.stats.currentHp, max: this.stats.maxHp });
    gameBridge.emit("player:resource", { current: this.stats.currentMana, max: this.stats.maxMana, type: "mana" });
    gameBridge.emit("player:resource", { current: this.stats.currentStamina, max: this.stats.maxStamina, type: "stamina" });
    gameBridge.emit("player:level", { level: this.stats.level, xp: this.stats.xp, xpToNext: this.stats.xpToNext });
  }

  update(): void {
    if (!this.matchStarted) return;

    this.handleMovement();
    this.maybeSpawnVfx(this.player.x, this.player.y);
    this.updatePlayerAnimation();
    this.updateEnemyAnimation();
  }

  private updatePlayerAnimation(): void {
    const body = this.player.body;
    const vx = body?.velocity.x ?? 0;
    const vy = body?.velocity.y ?? 0;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > 10) {
      this.player.play("hero_run", true);
    } else if (speed > 0) {
      this.player.play("hero_walk", true);
    } else {
      this.player.play("hero_idle", true);
    }
  }

  private updateEnemyAnimation(): void {
    if (!this.enemy?.active) return;
    this.enemy.play("skeleton_idle", true);
  }

  private handleMovement(): void {
    const speed = this.stats.speed;
    const left = this.cursors.left?.isDown || this.wasd.A?.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D?.isDown;
    const up = this.cursors.up?.isDown || this.wasd.W?.isDown;
    const down = this.cursors.down?.isDown || this.wasd.S?.isDown;

    this.player.setVelocity(0);

    if (left) this.player.setVelocityX(-speed);
    else if (right) this.player.setVelocityX(speed);

    if (up) this.player.setVelocityY(-speed);
    else if (down) this.player.setVelocityY(speed);

    const body = this.player.body;
    if (body && body.velocity) {
      body.velocity.normalize().scale(speed);
    }
  }

  shutdown(): void {
    gameBridge!.off("match:start", this.matchStartHandler);
    gameBridge!.off("loadout:update", this.loadoutUpdateHandler);
    gameBridge!.off("pause", this.pauseHandler);
    gameBridge!.off("resume", this.resumeHandler);
    gameBridge!.off("match:exit", this.matchExitHandler);
  }
}
