import Phaser from 'phaser';
import KleeblattAdventure from './game-core.js';
import WalletService from './wallet.js';

const config = {
  type: Phaser.CANVAS,
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
  },
  disableVisibilityChange: true
};

let game = null;
try {
  game = new Phaser.Game(config);
  window.game = game;
} catch (error) {
  console.error('Failed to initialize Phaser:', error);
  document.getElementById('game-container').innerHTML = '<p style="color:white;text-align:center;padding:20px;">Failed to load game. Please refresh.</p>';
}

const wallet = new WalletService();
window.wallet = wallet;

const initGame = async () => {
  if (!game) return;
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
