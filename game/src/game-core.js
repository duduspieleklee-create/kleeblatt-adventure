import Phaser from 'phaser';

export const gameData = {
  players: {},
  score: 0,
  collections: 0,
  achievements: [],
  wallet: null,
  isValid: false
};

class KleinanzeigenAdventure extends Phaser.Scene {
  constructor(config) {
    super('KleinanzeigenAdventure', config);
    this.player = null;
    this.treasure = null;
    this.isLeft = false;
    this.isRight = false;
    this.isUp = false;
    this.isDown = false;
  }

  preload() {
    // Generate placeholder textures using Phaser's built-in shapes
    const graphics = this.make.graphics({ x: 0, y: 0 });
    
    // Background texture
    graphics.beginFill(0x2d3748).drawRect(0, 0, 64, 64).endFill();
    graphics.generateTexture('gameBackground', 64, 64);
    graphics.clear();
    
    // Player texture (green circle)
    graphics.beginFill(0x4ade80).drawCircle(32, 32, 30).endFill();
    graphics.generateTexture('player', 64, 64);
    graphics.clear();
    
    // Treasure texture (gold star/circle)
    graphics.beginFill(0xfbbf24).drawCircle(32, 32, 30).endFill();
    graphics.generateTexture('treasure', 64, 64);
    graphics.clear();
    
    // Messages
    this.load.on('progress', (value) => {
      this.scene.get('Loading').message.setText(`Loading ${Math.round(value * 100)}%`);
    });
  }

  create() {
    // Initialize game state
    gameData.score = 0;
    gameData.collections = 0;
    gameData.achievements = [];

    // Create game layout
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 800, 600, 0x2d3748);
    this.add.rectangle(410, 305, 820, 620, 0x1a1a2e).setOrigin(0.5);
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 800, 600, 0x3d4a60).setOrigin(0).setAlpha(0.2);
  }

  update(time, delta) {
    // Handle player movement
    if (this.isLeft) {
      if (!this.player.body.blocked.left) {
        this.player.setVelocityX(-300);
      }
    } else if (this.isRight) {
      if (!this.player.body.blocked.right) {
        this.player.setVelocityX(300);
      }
    } else {
      this.player.setVelocityX(0);
    }

    if (this.isUp) {
      if (!this.player.body.blocked.up) {
        this.player.setVelocityY(-300);
      }
    } else if (this.isDown) {
      if (!this.player.body.blocked.down) {
        this.player.setVelocityY(300);
      }
    } else {
      this.player.setVelocityY(0);
    }
  }

  createUI() {
    const style = { fontSize: '32px', fill: '#00ff00', backgroundColor: '#00000090', padding: { x: 10, y: 5 } };
    
    this.scoreText = this.add.text(20, 20, 'Score: 0', style);
    
    this.infoText = this.add.text(20, 70, 'Find hidden treasures! 🏆\nWASD or Arrow Keys to move', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0);
    
    // Connect wallet button
    const walletBtn = this.add.text(350, 20, ' ─────────────────────────────', style).setOrigin(0.5).setAlpha(0.2);
  }
}

export default KleinanzeigenAdventure;
