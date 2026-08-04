import Phaser from "phaser";
import { gameBridge, type GameBridgeEvents } from "@kleeblatt/shared";

/** Dev-only logging helper. */
function devLog(...args: unknown[]) {
  if (import.meta.env.DEV) console.log(...args);
}
function devError(...args: unknown[]) {
  if (import.meta.env.DEV) console.error(...args);
}

export class MatchScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
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
private enemiesKilled = 0;
  private chestsOpened = 0;
  private readonly pauseHandler = () => this.scene.pause("match");
  private readonly resumeHandler = () => this.scene.resume("match");
  private readonly matchExitHandler = () => this.onMatchExit();
  private readonly matchStartHandler = this.onMatchStart.bind(this);
  private readonly loadoutUpdateHandler = this.onLoadoutUpdate.bind(this);
  private vfxZones: Array<{ x: number; y: number; radius: number; key: string }> = [];
  private enemy!: Phaser.Physics.Arcade.Sprite;
  private villageZone!: { x: number; y: number; width: number; height: number };
  private landmarks: Array<{ label: string; x: number; y: number }> = [];
  private npcs: Array<{ label: string; x: number; y: number }> = [];
  private activeTimers: Phaser.Time.TimerEvent[] = [];

  // Pre-created particle emitters (avoids per-frame allocation leak)
  private vfxEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private vfxLastSpawn = 0;
  private readonly VFX_THROTTLE_MS = 200;

  constructor() {
    super("match");
    this.matchId = "proto-" + Date.now();
  }

  create(): void {
    try {
      devLog("[MatchScene] create() started");
      this.createMap();
      devLog("[MatchScene] map created");
      this.createVillage();
      devLog("[MatchScene] village created");
      this.createPlayer();
      devLog("[MatchScene] player created");
      this.createSkeleton();
      devLog("[MatchScene] skeleton created");
      this.createCrops();
      this.createAnimals();
      this.createVfxTriggers();
      this.createVfxEmitters();
      this.setupInput();
      this.setupCamera();
      this.setupCollisions();
      this.setupGameBridge();

      devLog("[MatchScene] auto-starting match");
      this.matchStarted = true;
      this.emitInitialStats();
      gameBridge.emit("match:started", { matchId: this.matchId });
      devLog("[MatchScene] match started, player at", this.player.x, this.player.y);
    } catch (e) {
      devError(`[MatchScene] create() CRASHED: ${e}`);
    }
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
        // Fill ground with tile 0
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            groundLayer.putTileAt(0, x, y, true);
          }
        }
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

  private createVillage(): void {
    const mapW = this.map.widthInPixels;
    const mapH = this.map.heightInPixels;

    // Village zone centered in the map
    this.villageZone = {
      x: mapW * 0.2,
      y: mapH * 0.2,
      width: mapW * 0.6,
      height: mapH * 0.6,
    };

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
      { label: "Rathaus", x: zone.x + zone.width * 0.25, y: zone.y + zone.height * 0.25 },
      { label: "Taverne", x: zone.x + zone.width * 0.75, y: zone.y + zone.height * 0.25 },
      { label: "Lagerfeuer", x: zone.x + zone.width * 0.5, y: zone.y + zone.height * 0.75 },
    ];

    this.npcs = [
      { label: "Auftraggeber", x: zone.x + zone.width * 0.3, y: zone.y + zone.height * 0.5 },
      { label: "Händler", x: zone.x + zone.width * 0.7, y: zone.y + zone.height * 0.5 },
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

  private createPlayer(): void {
    const mapW = this.map.widthInPixels;
    const mapH = this.map.heightInPixels;

    this.player = this.physics.add.sprite(mapW * 0.5, mapH * 0.5, "hero_idle");
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.play("hero_idle", true);
  }

  private createSkeleton(): void {
    const mapW = this.map.widthInPixels;
    const mapH = this.map.heightInPixels;

    this.enemy = this.physics.add.sprite(mapW * 0.75, mapH * 0.75, "skeleton_idle");
    this.enemy.setCollideWorldBounds(true);
    this.enemy.setDepth(10);
    this.enemy.play("skeleton_idle", true);
  }

  private createVfxEmitters(): void {
    // Pre-create one emitter per VFX zone to avoid per-frame allocation leak
    for (const zone of this.vfxZones) {
      const emitter = this.add.particles(zone.x, zone.y, zone.key, {
        speed: { min: 10, max: 30 },
        lifespan: 600,
        quantity: 1,
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.6, end: 0 },
        maxParticles: 30,
        emitting: false,
      });
      this.vfxEmitters.push(emitter);
    }
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Capture game keys to prevent browser scrolling
    this.input.keyboard!.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    ]);
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setZoom(1);
  }

  private setupCollisions(): void {
    if (this.wallLayer) {
      this.physics.add.collider(this.player, this.wallLayer);
      this.physics.add.collider(this.enemy, this.wallLayer);
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
    const zone = this.villageZone;
    const crops = [
      { x: zone.x + 40, y: zone.y + 40, key: "crop_wheat" },
      { x: zone.x + 80, y: zone.y + 40, key: "crop_wheat" },
      { x: zone.x + 40, y: zone.y + 80, key: "crop_carrot" },
      { x: zone.x + zone.width - 60, y: zone.y + zone.height - 60, key: "crop_pumpkin" },
    ];

    for (const crop of crops) {
      this.add.image(crop.x, crop.y, crop.key).setDepth(1);
    }
  }

  private createAnimals(): void {
    const zone = this.villageZone;
    const animals = [
      { x: zone.x + zone.width * 0.8, y: zone.y + zone.height * 0.3, key: "animal_cow" },
      { x: zone.x + zone.width * 0.85, y: zone.y + zone.height * 0.35, key: "animal_chicken" },
    ];

    for (const animal of animals) {
      this.add.image(animal.x, animal.y, animal.key).setDepth(1);
    }
  }

  private createVfxTriggers(): void {
    const mapW = this.map.widthInPixels;
    const mapH = this.map.heightInPixels;

    this.vfxZones = [
      { x: mapW * 0.4, y: mapH * 0.6, radius: 80, key: "vfx_dust" },
      { x: mapW * 0.8, y: mapH * 0.2, radius: 60, key: "vfx_smoke" },
    ];
  }

  private maybeSpawnVfx(x: number, y: number, time: number): void {
    // Throttle VFX spawning to avoid per-frame allocation
    if (time - this.vfxLastSpawn < this.VFX_THROTTLE_MS) return;

    for (let i = 0; i < this.vfxZones.length; i++) {
      const zone = this.vfxZones[i];
      if (!zone) continue;
      const dx = x - zone.x;
      const dy = y - zone.y;
      if (dx * dx + dy * dy <= zone.radius * zone.radius) {
        const emitter = this.vfxEmitters[i];
        if (emitter) {
          emitter.explode(8);
          this.vfxLastSpawn = time;
        }
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
      enemiesKilled: this.enemiesKilled,
      chestsOpened: this.chestsOpened,
    });
  }

  /** Wird bei Enemy-Tod aufgerufen (P5/P6) – Kill zählt für die XP-Verrechnung. */
  onEnemyKilled(): void {
    this.enemiesKilled += 1;
  }

  /** Wird beim Öffnen einer Kiste aufgerufen (P7). */
  onChestOpened(): void {
    this.chestsOpened += 1;
    gameBridge.emit("chest:opened", { chestId: "chest-" + this.chestsOpened });
  }

  private emitInitialStats(): void {
    gameBridge.emit("player:hp", { current: this.stats.currentHp, max: this.stats.maxHp });
    gameBridge.emit("player:resource", {
      current: this.stats.currentMana,
      max: this.stats.maxMana,
      type: "mana",
    });
    gameBridge.emit("player:resource", {
      current: this.stats.currentStamina,
      max: this.stats.maxStamina,
      type: "stamina",
    });
    gameBridge.emit("player:level", {
      level: this.stats.level,
      xp: this.stats.xp,
      xpToNext: this.stats.xpToNext,
    });
  }

  update(time: number, _delta: number): void {
    if (!this.matchStarted) return;

    this.handleMovement();
    this.maybeSpawnVfx(this.player.x, this.player.y, time);
    this.updatePlayerAnimation();
    this.updateEnemyAnimation();
  }

  private updatePlayerAnimation(): void {
    if (!this.player.active) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    const vx = body?.velocity.x ?? 0;
    const vy = body?.velocity.y ?? 0;
    const speed = Math.sqrt(vx * vx + vy * vy);

    if (speed > 150) {
      this.player.anims.stop();
      this.player.play("hero_run", true);
    } else if (speed > 10) {
      this.player.anims.stop();
      this.player.play("hero_walk", true);
    } else {
      this.player.anims.stop();
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

    // Compute normalized direction in local variables (don't mutate body.velocity directly)
    let vx = 0;
    let vy = 0;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
    } else {
      this.player.setVelocity(0);
    }
  }

  shutdown(): void {
    // Clean up tracked timers
    for (const t of this.activeTimers) {
      t.remove(false);
    }
    this.activeTimers = [];

    // Clean up particle emitters
    for (const emitter of this.vfxEmitters) {
      emitter.destroy();
    }
    this.vfxEmitters = [];

    // Clean up gameBridge listeners
    gameBridge.off("match:start", this.matchStartHandler);
    gameBridge.off("loadout:update", this.loadoutUpdateHandler);
    gameBridge.off("pause", this.pauseHandler);
    gameBridge.off("resume", this.resumeHandler);
    gameBridge.off("match:exit", this.matchExitHandler);
  }
}