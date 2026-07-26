import Phaser from 'phaser';
import KleeblattAdventure from './game-core.js';
import WalletService from './wallet.js';

const debugPanel = document.getElementById('debug-panel');
let debugVisible = false;

function logDebug(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `debug-entry debug-${type}`;
  const timestamp = new Date().toLocaleTimeString();
  entry.textContent = `[${timestamp}] ${message}`;
  debugPanel.appendChild(entry);
  debugPanel.scrollTop = debugPanel.scrollHeight;
  console.log(`[${type}] ${message}`);
}

function showDebug() {
  debugPanel.classList.add('visible');
  debugVisible = true;
}

function hideDebug() {
  debugPanel.classList.remove('visible');
  debugVisible = false;
}

window.toggleDebug = function() {
  if (debugVisible) {
    hideDebug();
  } else {
    showDebug();
  }
};

window.addEventListener('error', (event) => {
  logDebug(`ERROR: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`, 'error');
  showDebug();
});

window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  const message = error?.message || error?.toString() || 'Unknown error';
  logDebug(`UNHANDLED REJECTION: ${message}`, 'error');
  showDebug();
});

logDebug('Game starting...', 'info');
logDebug(`User Agent: ${navigator.userAgent}`, 'info');
logDebug(`Platform: ${navigator.platform}`, 'info');

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
  disableVisibilityChange: true,
  callbacks: {
    preBoot: (game) => {
      logDebug('Phaser preBoot callback', 'info');
    },
    postBoot: (game) => {
      logDebug('Phaser postBoot callback', 'info');
    }
  }
};

let game = null;
try {
  logDebug('Initializing Phaser...', 'info');
  game = new Phaser.Game(config);
  window.game = game;
  logDebug('Phaser initialized successfully', 'info');
} catch (error) {
  logDebug(`Failed to initialize Phaser: ${error.message}`, 'error');
  logDebug(`Stack: ${error.stack}`, 'error');
  document.getElementById('game-container').innerHTML = '<p style="color:white;text-align:center;padding:20px;">Failed to load game. Check debug panel below.</p>';
  showDebug();
}

const wallet = new WalletService();
window.wallet = wallet;

const initGame = async () => {
  if (!game) return;
  try {
    const status = wallet.getConnectedStatus();
    if (status.isConnected) {
      logDebug(`Wallet connected: ${status.address}`, 'info');
    }
    logDebug('Game initialized', 'info');
    logDebug(`Wallet status: ${JSON.stringify(status)}`, 'info');
  } catch (error) {
    logDebug(`Game initialization failed: ${error.message}`, 'error');
    logDebug(`Stack: ${error.stack}`, 'error');
  }
};

initGame();

setTimeout(() => {
  logDebug('Debug panel ready. Tap Debug button to toggle.', 'info');
}, 1000);
