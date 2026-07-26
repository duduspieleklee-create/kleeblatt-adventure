import Phaser from 'phaser';
import { TREASURE_CATEGORIES, addTreasure, gameData } from './core/index.js';

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
  }

  preload() {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.beginFill(0x2d3748).drawRect(0, 0, 64, 64).endFill();
    graphics.generateTexture('gameBackground', 64, 64);
    graphics.clear();

    graphics.beginFill(0x4ade80).drawCircle(32, 32, 30).endFill();
    graphics.generateTexture('player', 64, 64);
    graphics.clear();

    graphics.beginFill(0xfbbf24).drawCircle(32, 32, 30).endFill();
    graphics.generateTexture('treasure', 64, 64);
    graphics.clear();
  }

  create() {
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

    this.physics.world.setBounds(0, 0, 800, 600);

    this.createUI();
    this.spawnTreasures(5);
  }

  update() {
    const speed = 300;
    this.player.setVelocity(0);

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

    this.checkCollisions();
  }

  createUI() {
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '28px',
      fill: '#00ff00',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0);

    this.infoText = this.add.text(20, 60, 'Find treasures! WASD/Arrows to move', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setScrollFactor(0);
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
