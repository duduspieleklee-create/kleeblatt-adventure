import Phaser from 'phaser';
import { TREASURE_CATEGORIES, addTreasure, gameData } from './core/index.js';
import WalletService from './wallet.js';

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
    this.walletService = null;
    this.walletText = null;
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
      logDebug(`Stack: ${error.stack}`, 'error');
    }
  }

  create() {
    try {
      logDebug('Scene create starting', 'info');
      gameData.score = 0;
      gameData.collections = 0;
      gameData.achievements = [];
      gameData.treasures = [];
      this.treasures = [];
      this.celebrationComplete = false;

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
        right: Phaser.Input.Keyboard.KeyCodes.D
      });

      this.joystick = this.game.registry.get('joystick');
      this.isMobile = this.game.registry.get('isMobile') || false;

      this.walletService = new WalletService();
      window.wallet = this.walletService;

      this.physics.world.setBounds(0, 0, 800, 600);

      this.createUI();
      this.spawnTreasures(5);
      logDebug(`Scene create complete. Mobile: ${this.isMobile}, Joystick: ${!!this.joystick}`, 'info');
    } catch (error) {
      logDebug(`create error: ${error.message}`, 'error');
      logDebug(`Stack: ${error.stack}`, 'error');
    }
  }

  update() {
    try {
      const speed = 300;
      this.player.setVelocity(0);

      let moveX = 0;
      let moveY = 0;

      if (this.isMobile && this.joystick) {
        const axis = this.joystick.getAxis();
        moveX = axis.x;
        moveY = axis.y;

        if (Math.abs(moveX) > 0.1) {
          this.player.setVelocityX(moveX * speed);
        }
        if (Math.abs(moveY) > 0.1) {
          this.player.setVelocityY(moveY * speed);
        }
      } else {
        if (this.cursors.left.isDown || this.keys.left.isDown) {
          this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown || this.keys.right.isDown) {
          this.player.setVelocityX(speed);
        }

        if (this.cursors.up.isDown || this.keys.up.isDown) {
          this.player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown || this.keys.down.isDown) {
          this.player.setVelocityY(speed);
        }
      }

      this.checkCollisions();
      this.updateWalletUI();
    } catch (error) {
      logDebug(`update error: ${error.message}`, 'error');
      logDebug(`Stack: ${error.stack}`, 'error');
    }
  }

  createUI() {
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '28px',
      fill: '#00ff00',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0);

    if (this.isMobile) {
      this.infoText = this.add.text(20, 60, 'Use joystick to move', {
        fontSize: '16px',
        fill: '#ffffff'
      }).setScrollFactor(0);
    } else {
      this.infoText = this.add.text(20, 60, 'Find treasures! WASD/Arrows to move', {
        fontSize: '16px',
        fill: '#ffffff'
      }).setScrollFactor(0);
    }

    this.walletText = this.add.text(400, 20, 'Connect Wallet', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#f6416c',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });

    this.walletText.on('pointerdown', () => {
      this.connectWallet();
    });

    this.updateWalletUI();
  }

  async connectWallet() {
    try {
      logDebug('Connecting wallet...', 'info');
      const result = await this.walletService.connect();
      logDebug(`Wallet connected: ${result.account}`, 'info');
      this.updateWalletUI();
      this.infoText.setText('Wallet connected! Start playing!');
    } catch (error) {
      logDebug(`Wallet connection failed: ${error.message}`, 'error');
      this.infoText.setText('Wallet connection failed');
    }
  }

  updateWalletUI() {
    if (!this.walletText) return;
    const status = this.walletService.getConnectedStatus();
    if (status.isConnected) {
      this.walletText.setText(`Wallet: ${status.address}`);
      this.walletText.setBackgroundColor('#4ade80');
    } else if (status.isSupported) {
      this.walletText.setText('Connect Wallet');
      this.walletText.setBackgroundColor('#f6416c');
    } else {
      this.walletText.setText('No Wallet');
      this.walletText.setBackgroundColor('#888888');
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
        const category = treasure.getData('category');
        const collected = addTreasure(categoryId);

        if (collected) {
          treasure.destroy();
          this.treasures.splice(i, 1);
          this.scoreText.setText(`Score: ${gameData.score}`);
          this.infoText.setText(`Collected: ${gameData.collections}/10`);

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

  showCelebration() {
    this.infoText.setText('Congratulations! Found 5+ treasures!');
  }
}
