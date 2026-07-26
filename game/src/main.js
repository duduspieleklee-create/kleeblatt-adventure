/**
 * Kleinanzeigen Adventure - Main Game Entry
 * 2D Browser Game on Gala Chain with Playworks Integration
 */

import Phaser from 'phaser';

// Import custom modules
import KleinanzeigenAdventure from './game-core';
import WalletService, { updateWalletUI } from './wallet';

// Create game instance - must use different name to avoid conflicts
const adventureGame = new Phaser.Game(
  {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#667eea',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [KleinanzeigenAdventure],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    }
  }
);

// Create wallet service singleton
const wallet = new WalletService();

// Expose game and wallet to window for DOM access
window.game = adventureGame;
window.wallet = wallet;

// Initialize game
const initGame = async () => {
  try {
    // Check if wallet is supported
    const status = wallet.getConnectedStatus();
    if (status.isConnected) {
      alert('Wallet Connected! Ready to play.');
    }
    
    console.log('Game initialized');
    console.log('Wallet Status:', status);
    
  } catch (error) {
    console.error('Game initialization failed:', error);
  }
}

// Start loading and initialize game
initGame();

// Create loading scene
const bootstrap = new Phaser.Scene('Loading');

bootstrap.preload = function() {
  const loader = this.add.container(400, 300);
  
  loadingLabel = this.add.text(400, 300, 'Kleinanzeigen Adventure', {
    fontSize: '32px',
    color: '#ffffff',
    fontStyle: 'bold'
  }).setOrigin(0.5);
  
  label = this.add.text(400, 350, 'Connecting to blockchain...', {
    fontSize: '16px',
    color: '#aaaaaa'
  }).setOrigin(0.5);
  
  progressBar = this.add.graphics();
  barFill = this.add.graphics();
};

bootstrap.create = () => {
  // Add loading spinner or progress
  this.game.scene.start('KleinanzeigenAdventure');
};

adventureGame.addScene(bootstrap);
adventureGame.scene.start('Loading');
