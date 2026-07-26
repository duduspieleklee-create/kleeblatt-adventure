import Phaser from 'phaser';
import { TREASURE_CATEGORIES, addTreasure, gameData } from './core/index.js';
import { submitScore, getProfile } from './api.js';

const logDebug = (message, type = 'info') => {
  if (typeof window !== 'undefined' && window.__debugLog) {
    window.__debugLog(message, type);
  }
  console.log(`[${type}] ${message}`);
};

try {
  window.__debugLog && window.__debugLog('game-core.js module loaded successfully', 'info');
} catch (e) {
  console.log('game-core.js module loaded');
}

export default class KleeblattAdventure extends Phaser.Scene {
  constructor() {
    super('KleeblattAdventure');
    this.player = null;
    this.treasures = [];
    this.cursors = null;
    this.keys = null;
    this.scoreText = null;
    this.infoText = null;
    this.celebrationComplete = false;
    this.joystick = null;
    this.isMobile = false;
    this.userText = null;
    this.highScoreText = null;
    this.token = null;
    this.username = null;
    this.userId = null;
    this.isGuest = false;
    this.scoreSubmitQueue = [];
    this.lastScoreSubmit = 0;
    this.highScore = 0;
  }

  init(data) {
    this.token = data?.token || null;
    this.username = data?.username || 'Player';
    this.userId = data?.userId || null;
    this.isGuest = data?.isGuest !== false;
  }

  preload() {
    try {
      logDebug('Scene preload starting', 'info');
      const graphics = this.make.graphics({ x: 0, y: 0 });

      graphics.fillStyle(0x2d3748, 1);
      graphics.fillRect(0, 0, 64, 64);
      graphics.generateTexture('gameBackground', 64, 64);
      graphics.clear();

      graphics.fillStyle(0x4ade80, 1);
      graphics.fillCircle(32, 32, 30);
      graphics.generateTexture('player', 64, 64);
      graphics.clear();

      graphics.fillStyle(0xfbbf24, 1);
      graphics.fillCircle(32, 32, 30);
      graphics.generateTexture('treasure', 64, 64);
      graphics.clear();
      logDebug('Scene preload complete', 'info');
    } catch (error) {
      logDebug(`preload error: ${error.message}`, 'error');
    }
  }

  create() {
    try {
      logDebug(`Scene create starting - User: ${this.username}`, 'info');
      gameData.score = 0;
      gameData.collections = 0;
      gameData.achievements = [];
      gameData.treasures = [];
      this.treasures = [];
      this.celebrationComplete = false;
      this.scoreSubmitQueue = [];
      this.lastScoreSubmit = 0;

      this.add.rectangle(400, 300, 800, 600, 0x2d3748);
      this.add.rectangle(410, 305, 820, 620, 0x1a1a2e).setOrigin(0.5);

      this.player = this.physics.add.sprite(400, 300, 'player');
      this.player.setCircle(20);
      this.player.body.setCollideWorldBounds(true);
      this.player.setDisplaySize(40, 40);

      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      });

      this.joystick = this.game.registry.get('joystick');
      this.isMobile = this.game.registry.get('isMobile') || false;

      this.physics.world.setBounds(0, 0, 800, 600);

      this.createUI();
      this.spawnTreasures(5);
      this.fetchProfile();

      logDebug(`Scene create complete. Mobile: ${this.isMobile}`, 'info');
    } catch (error) {
      logDebug(`create error: ${error.message}`, 'error');
    }
  }

  update(time) {
    try {
      const speed = 300;
      this.player.setVelocity(0);

      let moveX = 0;
      let moveY = 0;

      if (this.isMobile && this.joystick) {
        const axis = this.joystick.getAxis();
        moveX = axis.x;
        moveY = axis.y;
        if (Math.abs(moveX) > 0.1) this.player.setVelocityX(moveX * speed);
        if (Math.abs(moveY) > 0.1) this.player.setVelocityY(moveY * speed);
      } else {
        if (this.cursors.left.isDown || this.keys.left.isDown) this.player.setVelocityX(-speed);
        else if (this.cursors.right.isDown || this.keys.right.isDown) this.player.setVelocityX(speed);
        if (this.cursors.up.isDown || this.keys.up.isDown) this.player.setVelocityY(-speed);
        else if (this.cursors.down.isDown || this.keys.down.isDown) this.player.setVelocityY(speed);
      }

      this.checkCollisions();
      this.flushScoreQueue(time);
    } catch (error) {
      logDebug(`update error: ${error.message}`, 'error');
    }
  }

  createUI() {
    const guestLabel = this.isGuest ? ' (Guest)' : '';
    this.userText = this.add.text(20, 10, `${this.username}${guestLabel}`, {
      fontSize: '16px',
      fill: '#4ade80',
      backgroundColor: '#00000080',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0);

    this.scoreText = this.add.text(20, 44, 'Score: 0', {
      fontSize: '26px',
      fill: '#fbbf24',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 },
    }).setScrollFactor(0);

    this.highScoreText = this.add.text(20, 82, 'Best: ...', {
      fontSize: '14px',
      fill: '#a0aec0',
      backgroundColor: '#00000080',
      padding: { x: 8, y: 3 },
    }).setScrollFactor(0);

    const hint = this.isMobile ? 'Use joystick to move' : 'WASD/Arrows to move';
    this.infoText = this.add.text(400, 580, hint, {
      fontSize: '15px',
      fill: '#718096',
    }).setOrigin(0.5).setScrollFactor(0);
  }

  async fetchProfile() {
    if (!this.token) return;
    try {
      const profile = await getProfile(this.token);
      this.highScore = profile.high_score;
      this.highScoreText.setText(`Best: ${this.highScore}`);
      logDebug(`Profile: high=${this.highScore}, games=${profile.games_played}`, 'info');
    } catch (err) {
      logDebug(`Profile fetch failed: ${err.message}`, 'warn');
    }
  }

  spawnTreasures(count) {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 550);
      const categoryId = Phaser.Math.Between(1, TREASURE_CATEGORIES.length);
      const category = TREASURE_CATEGORIES.find(c => c.id === categoryId);

      const treasure = this.physics.add.sprite(x, y, 'treasure');
      treasure.setDisplaySize(30, 30);
      treasure.setData('categoryId', categoryId);
      treasure.setData('category', category);
      this.treasures.push(treasure);
    }
  }

  checkCollisions() {
    for (let i = this.treasures.length - 1; i >= 0; i--) {
      const treasure = this.treasures[i];
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        treasure.x, treasure.y
      );

      if (dist < 30) {
        const categoryId = treasure.getData('categoryId');
        const collected = addTreasure(categoryId);

        if (collected) {
          treasure.destroy();
          this.treasures.splice(i, 1);
          this.scoreText.setText(`Score: ${gameData.score}`);

          if (this.highScore > 0 && gameData.score > this.highScore) {
            this.highScore = gameData.score;
            this.highScoreText.setText(`Best: ${this.highScore} NEW!`);
          }

          this.queueScoreSubmit(gameData.score, gameData.collections);

          if (this.treasures.length === 0) {
            this.spawnTreasures(5);
          }

          if (!this.celebrationComplete && gameData.collections >= 5) {
            this.celebrationComplete = true;
            this.showCelebration();
          }
        }
      }
    }
  }

  queueScoreSubmit(score, collections) {
    this.scoreSubmitQueue.push({ score, collections });
  }

  async flushScoreQueue(time) {
    if (!this.token) return;
    for (const entry of this.scoreSubmitQueue) {
      try {
        await submitScore(this.token, entry.score, entry.collections);
        logDebug(`Score saved: ${entry.score}`, 'info');
      } catch (err) {
        logDebug(`Score save failed: ${err.message}`, 'warn');
      }
    }
    this.scoreSubmitQueue = [];
    this.lastScoreSubmit = time;
  }

  showCelebration() {
    const { width, height } = this.scale;
    const popup = this.add.text(width / 2, height / 2, '5 Treasures!\nWell done!', {
      fontSize: '32px',
      fill: '#fbbf24',
      backgroundColor: '#000000cc',
      padding: { x: 20, y: 15 },
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: popup,
      alpha: 0,
      y: height / 2 - 60,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => popup.destroy(),
    });
  }
}
