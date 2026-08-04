import Phaser from "phaser";
import { gameBridge, type GameBridgeEvents } from "@kleeblatt/shared";
import { createCharacterAnimations, CHARACTER_ANIMS } from "../character-anims";

export class MatchScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private skeleton!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private attacking = false;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
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

  constructor() {
    super("match");
    this.matchId = "proto-" + Date.now();
  }

  create(): void {
    this.createMap();
    createCharacterAnimations(this);
    this.createPlayer();
    this.createEnemies();
    this.setupInput();
    this.setupCamera();
    this.setupCollisions();
    this.setupGameBridge();
  }

  private createMap(): void {
    const width = 40;
    const height = 30;
    const tileSize = 32;

    this.map = this.make.tilemap({ tileWidth: tileSize, tileHeight: tileSize, width, height });

    const tileset = this.map.addTilesetImage("tiles", "tile_ground", tileSize, tileSize, 0, 0);
    if (!tileset) {
      console.warn("Tileset not found, using placeholder");
      return;
    }

    const groundLayer = this.map.createBlankLayer("ground", tileset, 0, 0);
    if (groundLayer) {
      this.groundLayer = groundLayer;
      this.groundLayer.fill(0);
    }

    const wallLayer = this.map.createBlankLayer("walls", tileset, 0, 0);
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

  private createPlayer(): void {
    const startX = 640;
    const startY = 480;

    this.player = this.physics.add.sprite(startX, startY, "player");
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setScale(1);
    if (this.anims.exists(CHARACTER_ANIMS.player.idle)) {
      this.player.play(CHARACTER_ANIMS.player.idle);
    }
  }

  /** Gegner-Sprite: Skelett mit Idle-Animation (echtes Spritesheet, #84). */
  private createEnemies(): void {
    this.skeleton = this.physics.add.sprite(1024, 480, "skeleton_idle");
    this.skeleton.setDepth(10);
    this.skeleton.setCollideWorldBounds(true);
    if (this.anims.exists(CHARACTER_ANIMS.skeleton.idle)) {
      this.skeleton.play(CHARACTER_ANIMS.skeleton.idle);
    }
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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
      this.physics.add.collider(this.skeleton, this.wallLayer);
      this.physics.add.collider(this.player, this.skeleton);
    }
  }

  private setupGameBridge(): void {
    gameBridge.on("match:start", this.matchStartHandler);
    gameBridge.on("loadout:update", this.loadoutUpdateHandler);
    gameBridge.on("pause", this.pauseHandler);
    gameBridge.on("resume", this.resumeHandler);
    gameBridge.on("match:exit", this.matchExitHandler);
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

  update(): void {
    if (!this.matchStarted) return;

    this.handleMovement();
    this.handleAttack();
    this.updatePlayerAnimation();
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

  /** Space: Basisangriff-Animation (einmalig, mit Cooldown bis Animationsende). */
  private handleAttack(): void {
    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.attacking) {
      this.attacking = true;
      this.player.play(CHARACTER_ANIMS.player.attack, true);
      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.attacking = false;
      });
    }
  }

  /** Idle-/Walk-Animation passend zur Bewegung (Attack läuft ungestört weiter). */
  private updatePlayerAnimation(): void {
    if (this.attacking) return;
    const body = this.player.body;
    const moving = body !== null && body.velocity.length() > 0;
    const anim = moving ? CHARACTER_ANIMS.player.walk : CHARACTER_ANIMS.player.idle;
    if (!this.anims.exists(anim)) return;
    if (this.player.anims.currentAnim?.key !== anim) {
      this.player.play(anim, true);
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
