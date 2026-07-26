import Phaser from 'phaser';

// Game data tracking
export const gameData = {
  players: {},
  score: 0,
  collections: 0,
  achievements: [],
  wallet: null,
  isValid: false
};

// Main ADVENTURE game class
export default class KleeblattAdventure extends Phaser.Scene {
  constructor(config) {
    super('ADVENTURE', config);
    this.player = null;
    this.treasure = null;
    this.background = null;
    
    // Input handling
    this.isLeft = false;
    this.isRight = false;
    this.isUp = false;
    this.isDown = false;
  }

  preload() {
    // Load game backgrounds - colored rectangles if no images
    const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');
    this.scale.textures.addFrame(this.scale.textures.generateTextTexture('background', 'line-art', 'blue'));

    // Load player sprite - simple circle if no image
    this.treasures.addFrame(this.scale.textures.generateTextTexture('player', 'n arbitrary created'));

    // If no load images, use placeholder colors
    bg.setColor(0x2d3748); // Background blue-gray
  }

  create() {
    // Initialize game state
    gameData.score = 0;
    gameData.collections = 0;
    gameData.achievements = [];

    // Create background - simple gradient or solid color
    this.add.rectangle(400, 300, 800, 600, 0x2d3748);
    this.add.rectangle(400, 300, 810, 610, 0x1a1a2e, 0.5); // dark border

    // Create player - simple circle
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setCircle(20);
    this.player.body.setCollideWorldBounds(true);
    this.player.setDisplaySize(40, 40);
    this.physics.add.existing(this.player);

    // Spawn treasure item
    this.treasure = this.add.circle(700, 200);
    this.treasure.fillStyle = this.treasure.fillTransactions, 20, 'gold');
    this.physics.add.existing(this.treasure);
    this.treasure.setCircle(20);

    // Create UI elements
    this.createUI();

    // Add collision detection
    this.physics.add.collider(this.player, this.physics.add.collider(this.physics, this.physics));
  }

  createUI() {
    // Create score text
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '32px',
      fill: '#00ff00',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    });

    // Create info text
    this.infoText = this.add.text(20, 70, 'Find hidden treasures! 🏆\nWASD/Arrows to move', {
      fontSize: '18px',
      fill: '#ffffff'
    });

    // Create wallet connection button
    this.connectBtn = this.add.text(350, 100, 'Connect Wallet', {
      fontSize: '24px',
      backgroundColor: '#f6416c',
      color: '#fff',
      padding: { x: 20, y: 10 }
    }).setInteractive({
      useHandCursor: true,
      hitArea: new Phaser.Geom.Rectangle(320, 95, 160, 40),
      callbacks: {
        onDown: () => {
          this.walletConnect();
        }
      }
    });
  }

  update(time, delta) {
    // Handle player movement
    if (this.isLeft) {
      this.player.x -= 300;
    } else if (this.isRight) {
      this.player.x += 300;
    }

    if (this.isUp) {
      this.player.y -= 300;
    } else if (this.isDown) {
      this.player.y += 300;
    }
  }

  setupInput() {
    this.isUsingKeyboard = this.input.keyboard.addKeys('WASD');
    this.physics.add.collider(this.physics, this.physics, this.physics.add.collider(this.physics, this.physics));
  }

  spawnTreasure() {
    // Additional game logic would go here
    // Treasure spawning, collection handling, etc.
  }

  updateUI() {
    // Update game display elements
    // This method would be called when game state changes
  }
}
