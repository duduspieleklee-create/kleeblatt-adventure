import Phaser from "phaser";
import { gameBridge, type GameBridgeEvents } from "@kleeblatt/shared";
import { createWorldMap, DEFAULT_WORLD_SIZE, type WorldMapResult } from "../maps/createWorldMap";
import { CAMERA_ZOOM, CAMERA_DEADZONE } from "../constants";

/** Dev-only logging helper. */
function devLog(...args: unknown[]) {
  if (import.meta.env.DEV) console.info(...args);
}
function devError(...args: unknown[]) {
  if (import.meta.env.DEV) console.error(...args);
}

/** Attack range in pixels (melee). */
const ATTACK_RANGE = 80;
/** Attack cooldown ms. */
const ATTACK_COOLDOWN = 600;
/** Enemy chase distance threshold. */
const ENEMY_CHASE_DIST = 240;
/** Enemy patrol speed. */
const ENEMY_SPEED = 60;
/** Chest open proximity. */
const CHEST_OPEN_DIST = 64;

export class MatchScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private eKey!: Phaser.Input.Keyboard.Key;

  /** World built by createWorldMap (pixel size, not tile count). */
  private world!: WorldMapResult;
  private wallLayer!: Phaser.Tilemaps.TilemapLayer | null;

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
  private shutdownDone = false;
  private enemiesKilled = 0;
  private chestsOpened = 0;
  private readonly pauseHandler = () => this.scene.pause("match");
  private readonly resumeHandler = () => this.scene.resume("match");
  private readonly matchExitHandler = () => this.onMatchExit();
  private readonly matchStartHandler = this.onMatchStart.bind(this);
  private readonly loadoutUpdateHandler = this.onLoadoutUpdate.bind(this);
  private vfxZones: Array<{ x: number; y: number; radius: number; key: string }> = [];
  private villageZone!: { x: number; y: number; width: number; height: number };
  private landmarks: Array<{ label: string; x: number; y: number }> = [];
  private npcs: Array<{ label: string; x: number; y: number }> = [];
  private activeTimers: Phaser.Time.TimerEvent[] = [];

  private vfxEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private vfxLastSpawn = 0;
  private readonly VFX_THROTTLE_MS = 200;

  private lastAttackTime = 0;
  private isAttacking = false;
  private attackTimer: Phaser.Time.TimerEvent | null = null;

  private enemy!: Phaser.Physics.Arcade.Sprite;
  private enemyHp = 60;
  private enemyMaxHp = 60;
  private enemyAlive = true;
  private enemyHpBar!: Phaser.GameObjects.Rectangle;
  private enemyHpBg!: Phaser.GameObjects.Rectangle;
  private enemyHpText!: Phaser.GameObjects.Text;
  private enemyPatrolTarget = { x: 0, y: 0 };
  private enemyAttackCooldown = 1000;
  private lastEnemyAttack = 0;
  private enemyDamage = 8;

  private chests: Array<{
    sprite: Phaser.GameObjects.GameObject;
    label: Phaser.GameObjects.Text;
    x: number;
    y: number;
    opened: boolean;
    chestId: string;
  }> = [];
  private chestPromptText!: Phaser.GameObjects.Text;

  private damageNumbers: Phaser.GameObjects.Text[] = [];

  constructor() {
    super("match");
    this.matchId = "proto-" + Date.now();
  }

  private get worldW(): number {
    return this.world.widthPx;
  }

  private get worldH(): number {
    return this.world.heightPx;
  }

  create(): void {
    try {
      devLog("[MatchScene] create() started");
      this.createMap();
      devLog("[MatchScene] map created", this.worldW, "x", this.worldH);
      this.createVillage();
      devLog("[MatchScene] village created");
      this.createPlayer();
      devLog("[MatchScene] player created");
      this.createSkeleton();
      devLog("[MatchScene] skeleton created");
      this.createChests();
      this.createCrops();
      this.createAnimals();
      this.createVfxTriggers();
      this.createVfxEmitters();
      this.setupInput();
      this.setupCamera();
      this.setupCollisions();
      this.setupGameBridge();
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.onSceneShutdown());
      this.events.once(Phaser.Scenes.Events.DESTROY, () => this.onSceneShutdown());

      devLog("[MatchScene] auto-starting match");
      this.matchStarted = true;
      this.emitInitialStats();
      gameBridge.emit("match:started", { matchId: this.matchId });
      devLog("[MatchScene] match started, player at", this.player.x, this.player.y);
    } catch (e) {
      devError(`[MatchScene] create() CRASHED: ${e}`);
    }
  }

  /**
   * Large worlds: ground is a TileSprite (O(1)).
   * Walls are a sparse blank layer (border + few blockers only).
   * Never fill every cell — that freezes the loader at 21/21.
   */
  private createMap(): void {
    this.world = createWorldMap(this, {
      widthPx: DEFAULT_WORLD_SIZE.width,
      heightPx: DEFAULT_WORLD_SIZE.height,
      tileSize: 32,
      groundKey: "ground_tile",
      wallTilesetKey: "wall_tile",
      borderWalls: true,
    });

    this.wallLayer = this.world.wallLayer;

    // Small decorative markers (not a full tile layer)
    if (this.textures.exists("wall_tile")) {
      this.add.image(120, 120, "wall_tile").setDepth(0);
      this.add.image(this.worldW - 120, 100, "wall_tile").setDepth(0);
    }
  }

  private createVillage(): void {
    const mapW = this.worldW;
    const mapH = this.worldH;

    this.villageZone = {
      x: mapW * 0.2,
      y: mapH * 0.2,
      width: mapW * 0.6,
      height: mapH * 0.6,
    };

    const zone = this.villageZone;

    // Village tint scrolls with the world (not fixed to camera)
    this.add
      .rectangle(zone.x + zone.width / 2, zone.y + zone.height / 2, zone.width, zone.height, 0x2a4a2e, 0.25)
      .setDepth(0)
      .setScrollFactor(1);

    this.add
      .text(zone.x + zone.width / 2, zone.y - 15, "Willkommen-Dorf", {
        fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
        fontSize: "18px",
        color: "#88ff88",
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setScrollFactor(1);

    this.add
      .text(zone.x + zone.width / 2, zone.y + zone.height + 15, "Sicherer Bereich", {
        fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
        fontSize: "12px",
        color: "#8fa88f",
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setScrollFactor(1);

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
      this.add.rectangle(lm.x, lm.y, 40, 40, 0x5a3a1a, 0.8).setDepth(1).setScrollFactor(1);
      this.add
        .text(lm.x, lm.y - 25, lm.label, {
          fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
          fontSize: "11px",
          color: "#e8f0e8",
        })
        .setOrigin(0.5)
        .setDepth(2)
        .setScrollFactor(1);
    }

    for (const npc of this.npcs) {
      this.add.circle(npc.x, npc.y, 12, 0x88cc44, 0.9).setDepth(1).setScrollFactor(1);
      this.add
        .text(npc.x, npc.y - 20, npc.label, {
          fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
          fontSize: "10px",
          color: "#ffcc44",
        })
        .setOrigin(0.5)
        .setDepth(2)
        .setScrollFactor(1);
    }
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(this.worldW * 0.5, this.worldH * 0.5, "hero_idle");
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.play("hero_idle", true);

    this.chestPromptText = this.add
      .text(0, 0, "", {
        fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
        fontSize: "12px",
        color: "#ffcc44",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);
  }

  private createSkeleton(): void {
    this.enemy = this.physics.add.sprite(this.worldW * 0.75, this.worldH * 0.75, "skeleton_idle");
    this.enemy.setCollideWorldBounds(true);
    this.enemy.setDepth(10);
    this.enemy.play("skeleton_idle", true);

    this.enemyPatrolTarget = { x: this.worldW * 0.7, y: this.worldH * 0.7 };

    const barWidth = 64;
    const barHeight = 6;
    const barY = this.enemy.y - 44;

    this.enemyHpBg = this.add
      .rectangle(this.enemy.x, barY, barWidth, barHeight, 0x333333)
      .setDepth(11)
      .setScrollFactor(1);
    this.enemyHpBar = this.add
      .rectangle(this.enemy.x, barY, barWidth, barHeight, 0xcc3333)
      .setDepth(11)
      .setScrollFactor(1);
    this.enemyHpText = this.add
      .text(this.enemy.x, barY - 8, `${this.enemyHp}/${this.enemyMaxHp}`, {
        fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
        fontSize: "10px",
        color: "#ff6666",
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setScrollFactor(1);

    devLog("[MatchScene] enemy HP bar created");
  }

  private createChests(): void {
    const chestPositions = [
      { x: this.worldW * 0.2, y: this.worldH * 0.3 },
      { x: this.worldW * 0.8, y: this.worldH * 0.6 },
      { x: this.worldW * 0.5, y: this.worldH * 0.15 },
    ];

    for (let i = 0; i < chestPositions.length; i++) {
      const pos = chestPositions[i]!;
      const chestSprite = this.add.rectangle(pos.x, pos.y, 32, 24, 0xaa8833).setDepth(1).setScrollFactor(1);
      this.add.rectangle(pos.x, pos.y - 10, 32, 6, 0xccaa44).setDepth(1).setScrollFactor(1);
      const label = this.add
        .text(pos.x, pos.y - 22, "Kiste", {
          fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
          fontSize: "10px",
          color: "#ffcc44",
        })
        .setOrigin(0.5)
        .setDepth(2)
        .setScrollFactor(1);

      this.chests.push({
        sprite: chestSprite,
        label,
        x: pos.x,
        y: pos.y,
        opened: false,
        chestId: `chest_${i + 1}`,
      });
    }
  }

  private createVfxEmitters(): void {
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
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

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
      Phaser.Input.Keyboard.KeyCodes.E,
    ]);
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.setDeadzone(CAMERA_DEADZONE.width, CAMERA_DEADZONE.height);
    this.cameras.main.roundPixels = true;
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
      this.add.image(crop.x, crop.y, crop.key).setDepth(1).setScrollFactor(1);
    }
  }

  private createAnimals(): void {
    const zone = this.villageZone;
    const animals = [
      { x: zone.x + zone.width * 0.8, y: zone.y + zone.height * 0.3, key: "animal_cow" },
      { x: zone.x + zone.width * 0.85, y: zone.y + zone.height * 0.35, key: "animal_chicken" },
    ];

    for (const animal of animals) {
      this.add.image(animal.x, animal.y, animal.key).setDepth(1).setScrollFactor(1);
    }
  }

  private createVfxTriggers(): void {
    this.vfxZones = [
      { x: this.worldW * 0.4, y: this.worldH * 0.6, radius: 80, key: "vfx_dust" },
      { x: this.worldW * 0.8, y: this.worldH * 0.2, radius: 60, key: "vfx_smoke" },
    ];
  }

  private maybeSpawnVfx(x: number, y: number, time: number): void {
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

  private showDamageNumber(x: number, y: number, amount: number, color: number): void {
    const text = this.add
      .text(x, y, `-${amount}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: "#" + ("000000" + color.toString(16)).slice(-6),
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        text.destroy();
        const idx = this.damageNumbers.indexOf(text);
        if (idx !== -1) this.damageNumbers.splice(idx, 1);
      },
    });
    this.damageNumbers.push(text);
  }

  private playerAttack(time: number): void {
    if (time - this.lastAttackTime < ATTACK_COOLDOWN) return;
    if (!this.enemyAlive) return;

    this.lastAttackTime = time;
    this.isAttacking = true;

    this.player.anims.stop();
    this.player.play("hero_attack", false);

    this.attackTimer = this.time.delayedCall(300, () => {
      this.isAttacking = false;
      this.player.play("hero_idle", true);
    });
    if (this.attackTimer) this.activeTimers.push(this.attackTimer);

    const dx = this.enemy.x - this.player.x;
    const dy = this.enemy.y - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= ATTACK_RANGE) {
      const damage = this.stats.atk + Math.floor(Math.random() * 5);
      this.enemyHp = Math.max(0, this.enemyHp - damage);
      this.showDamageNumber(this.enemy.x, this.enemy.y - 20, damage, 0xff3333);

      this.enemy.setTint(0xff0000);
      this.time.delayedCall(150, () => this.enemy.clearTint());

      this.enemy.anims.stop();
      this.enemy.play("skeleton_hurt", false);
      this.time.delayedCall(400, () => {
        if (this.enemyAlive) this.enemy.play("skeleton_idle", true);
      });

      this.updateEnemyHpBar();

      gameBridge.emit("enemy:damaged", {
        enemyId: "skeleton_1",
        hp: this.enemyHp,
        maxHp: this.enemyMaxHp,
      });

      if (this.enemyHp <= 0) {
        this.killEnemy();
      }
    }
  }

  private updateEnemyHpBar(): void {
    if (!this.enemyAlive) return;
    const ratio = this.enemyHp / this.enemyMaxHp;
    const barWidth = 64;
    this.enemyHpBar.width = barWidth * Math.max(0, ratio);
    this.enemyHpBar.x = this.enemy.x - (barWidth * (1 - ratio)) / 2;
    this.enemyHpBg.x = this.enemy.x;
    this.enemyHpBg.y = this.enemy.y - 44;
    this.enemyHpBar.y = this.enemy.y - 44;
    this.enemyHpText.x = this.enemy.x;
    this.enemyHpText.y = this.enemy.y - 52;
    this.enemyHpText.setText(`${this.enemyHp}/${this.enemyMaxHp}`);
  }

  private killEnemy(): void {
    this.enemyAlive = false;
    this.enemy.anims.stop();
    this.enemy.play("skeleton_death", false);
    this.enemyHpBar.setVisible(false);
    this.enemyHpBg.setVisible(false);
    this.enemyHpText.setVisible(false);

    this.enemiesKilled += 1;

    const xpGained = 25;
    gameBridge.emit("enemy:died", {
      enemyId: "skeleton_1",
      typeId: "skeleton",
      xp: xpGained,
      x: this.enemy.x,
      y: this.enemy.y,
    });

    this.stats.xp += xpGained;
    if (this.stats.xp >= this.stats.xpToNext) {
      this.stats.xp -= this.stats.xpToNext;
      this.stats.level += 1;
      this.stats.xpToNext = Math.floor(this.stats.xpToNext * 1.5);
      this.stats.maxHp += 10;
      this.stats.currentHp = this.stats.maxHp;
      this.stats.atk += 2;
      gameBridge.emit("player:level", {
        level: this.stats.level,
        xp: this.stats.xp,
        xpToNext: this.stats.xpToNext,
      });
      gameBridge.emit("player:hp", { current: this.stats.currentHp, max: this.stats.maxHp });
    }

    gameBridge.emit("player:level", {
      level: this.stats.level,
      xp: this.stats.xp,
      xpToNext: this.stats.xpToNext,
    });

    this.time.delayedCall(5000, () => this.respawnEnemy());
  }

  private respawnEnemy(): void {
    let rx: number, ry: number, dist: number;
    do {
      rx = 100 + Math.random() * (this.worldW - 200);
      ry = 100 + Math.random() * (this.worldH - 200);
      const dx = rx - this.player.x;
      const dy = ry - this.player.y;
      dist = Math.sqrt(dx * dx + dy * dy);
    } while (dist < 200);

    this.enemy.x = rx;
    this.enemy.y = ry;
    this.enemyHp = this.enemyMaxHp;
    this.enemyAlive = true;
    this.enemy.setVisible(true);
    this.enemy.setActive(true);
    this.enemy.play("skeleton_idle", true);
    this.enemyHpBar.setVisible(true);
    this.enemyHpBg.setVisible(true);
    this.enemyHpText.setVisible(true);
    this.updateEnemyHpBar();
    this.enemyPatrolTarget = { x: rx - 40, y: ry };
  }

  private updateEnemyAI(_delta: number): void {
    if (!this.enemyAlive) return;

    const dx = this.player.x - this.enemy.x;
    const dy = this.player.y - this.enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= ENEMY_CHASE_DIST) {
      const nx = dx / dist;
      const ny = dy / dist;
      this.enemy.setVelocity(nx * ENEMY_SPEED, ny * ENEMY_SPEED);
      this.enemy.anims.stop();
      this.enemy.play("skeleton_walk", true);
      this.enemy.flipX = dx < 0;

      if (dist < 50) {
        const now = this.time.now;
        if (now - this.lastEnemyAttack > this.enemyAttackCooldown) {
          this.lastEnemyAttack = now;
          this.stats.currentHp = Math.max(0, this.stats.currentHp - this.enemyDamage);
          this.showDamageNumber(this.player.x, this.player.y - 20, this.enemyDamage, 0xffaa00);
          this.player.setTint(0xff0000);
          this.time.delayedCall(200, () => this.player.clearTint());

          gameBridge.emit("player:hp", {
            current: this.stats.currentHp,
            max: this.stats.maxHp,
          });

          if (this.stats.currentHp <= 0) {
            this.playerDeath();
          }
        }
      }
    } else {
      const pdx = this.enemyPatrolTarget.x - this.enemy.x;
      const pdy = this.enemyPatrolTarget.y - this.enemy.y;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

      if (pdist < 10) {
        this.enemyPatrolTarget = {
          x: 100 + Math.random() * (this.worldW - 200),
          y: 100 + Math.random() * (this.worldH - 200),
        };
      } else {
        this.enemy.setVelocity((pdx / pdist) * (ENEMY_SPEED * 0.4), (pdy / pdist) * (ENEMY_SPEED * 0.4));
        this.enemy.flipX = pdx < 0;
      }

      this.enemy.anims.stop();
      this.enemy.play("skeleton_idle", true);
    }
  }

  private playerDeath(): void {
    this.player.anims.stop();
    this.player.play("hero_death", false);
    gameBridge.emit("player:death", {});

    this.time.delayedCall(3000, () => {
      this.stats.currentHp = Math.floor(this.stats.maxHp * 0.5);
      this.player.x = this.worldW * 0.5;
      this.player.y = this.worldH * 0.5;
      this.player.setTint(0);
      this.player.play("hero_idle", true);
      gameBridge.emit("player:respawn", { hp: this.stats.currentHp });
      gameBridge.emit("player:hp", { current: this.stats.currentHp, max: this.stats.maxHp });
    });
  }

  private handleChests(): void {
    let nearestChest = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < this.chests.length; i++) {
      const chest = this.chests[i]!;
      if (chest.opened) continue;

      const dx = this.player.x - chest.x;
      const dy = this.player.y - chest.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestChest = i;
      }
    }

    if (nearestChest >= 0 && nearestDist <= CHEST_OPEN_DIST) {
      const chest = this.chests[nearestChest]!;
      this.chestPromptText.setText("Drucke E zum Oeffnen");
      this.chestPromptText.setPosition(this.player.x, this.player.y - 50);
      this.chestPromptText.setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
        chest.opened = true;
        if (chest.sprite instanceof Phaser.GameObjects.Rectangle) {
          chest.sprite.setFillStyle(0x555555);
        }
        chest.label.setText("geoeffnet");
        chest.label.setColor("#888888");
        this.chestPromptText.setVisible(false);

        this.chestsOpened += 1;
        gameBridge.emit("chest:opened", { chestId: chest.chestId });

        const lootItems = [
          { itemId: `loot_${this.chestsOpened}`, templateId: "iron_sword", name: "Eisenschwert", rarity: "selten" },
          { itemId: `loot_${this.chestsOpened}`, templateId: "health_potion", name: "Heiltrank", rarity: "gemein" },
          { itemId: `loot_${this.chestsOpened}`, templateId: "gold_coin", name: "Goldmuenze", rarity: "gemein" },
        ];
        const loot = lootItems[this.chestsOpened % lootItems.length]!;
        gameBridge.emit("loot:received", loot);

        this.showDamageNumber(this.player.x, this.player.y - 30, 0, 0x44ff44);
        const lootText = this.add
          .text(this.player.x, this.player.y - 40, loot.name, {
            fontFamily: "system-ui, sans-serif",
            fontSize: "14px",
            color: "#44ff44",
          })
          .setOrigin(0.5)
          .setDepth(30);
        this.tweens.add({
          targets: lootText,
          y: lootText.y - 30,
          alpha: 0,
          duration: 1200,
          onComplete: () => lootText.destroy(),
        });
      }
    } else {
      this.chestPromptText.setVisible(false);
    }
  }

  update(time: number, _delta: number): void {
    if (!this.matchStarted) return;

    this.handleMovement();
    this.handleAttack(time);
    this.updateEnemyAI(_delta);
    this.handleChests();
    this.maybeSpawnVfx(this.player.x, this.player.y, time);
    this.updatePlayerAnimation();
    this.updateEnemyHpBar();
  }

  private handleAttack(time: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.playerAttack(time);
    }
  }

  private updatePlayerAnimation(): void {
    if (!this.player.active || this.isAttacking) return;

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

  private handleMovement(): void {
    if (this.isAttacking) {
      this.player.setVelocity(0);
      return;
    }

    const speed = this.stats.speed;
    const left = this.cursors.left?.isDown || this.wasd.A?.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D?.isDown;
    const up = this.cursors.up?.isDown || this.wasd.W?.isDown;
    const down = this.cursors.down?.isDown || this.wasd.S?.isDown;

    let vx = 0;
    let vy = 0;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
      this.player.flipX = vx < 0;
    } else {
      this.player.setVelocity(0);
    }
  }

  private onSceneShutdown(): void {
    if (this.shutdownDone) return;
    this.shutdownDone = true;

    this.world?.destroyParallax();

    for (const t of this.activeTimers) {
      t.remove(false);
    }
    this.activeTimers = [];

    for (const emitter of this.vfxEmitters) {
      emitter.destroy();
    }
    this.vfxEmitters = [];

    for (const dn of this.damageNumbers) {
      dn.destroy();
    }
    this.damageNumbers = [];

    gameBridge.off("match:start", this.matchStartHandler);
    gameBridge.off("loadout:update", this.loadoutUpdateHandler);
    gameBridge.off("pause", this.pauseHandler);
    gameBridge.off("resume", this.resumeHandler);
    gameBridge.off("match:exit", this.matchExitHandler);
  }
}
