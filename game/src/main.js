import Phaser from 'phaser';
import KleeblattAdventure from './game-core.js';
import WalletService from './wallet.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [KleeblattAdventure],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};

const game = new Phaser.Game(config);

const wallet = new WalletService();
window.game = game;
window.wallet = wallet;

const initGame = async () => {
  try {
    const status = wallet.getConnectedStatus();
    if (status.isConnected) {
      console.log('Wallet connected:', status.address);
    }
    console.log('Game initialized');
    console.log('Wallet status:', status);
  } catch (error) {
    console.error('Game initialization failed:', error);
  }
};

initGame();
