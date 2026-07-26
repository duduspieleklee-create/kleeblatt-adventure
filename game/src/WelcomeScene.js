import Phaser from 'phaser';
import { guestLogin, walletLogin, getSession, getProfile } from './api.js';
import WalletService from './wallet.js';

const logDebug = (message, type = 'info') => {
  if (typeof window !== 'undefined' && window.__debugLog) {
    window.__debugLog(message, type);
  }
};

function promptUsername(title, desc, canSkip = true) {
  return new Promise((resolve) => {
    window._showUsernamePrompt(title, desc, canSkip, resolve);
  });
}

export default class WelcomeScene extends Phaser.Scene {
  constructor() {
    super('WelcomeScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    this.add.text(width / 2, 80, 'Kleeblatt Adventure', {
      fontSize: '38px',
      fontFamily: 'Arial',
      color: '#f6416c',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 130, 'Collect treasures. Climb the leaderboard.', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#a0aec0',
    }).setOrigin(0.5);

    const guestBg = this.add.rectangle(width / 2, 280, 300, 60, 0x4ade80);
    guestBg.setStrokeStyle(3, 0x22c55e);

    const guestText = this.add.text(width / 2, 280, 'Play as Guest', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    guestBg.setInteractive({ useHandCursor: true });
    guestText.setInteractive({ useHandCursor: true });

    const onGuestClick = async () => {
      guestBg.disableInteractive();
      guestText.disableInteractive();
      walletBg.disableInteractive();
      walletText.disableInteractive();
      guestText.setText('Connecting...');

      try {
        const session = await guestLogin();
        logDebug(`Guest logged in: ${session.username}`, 'info');
        this.scene.start('KleeblattAdventure', {
          token: session.access_token,
          username: session.username,
          userId: session.user_id,
          walletAddress: session.wallet_address,
          isGuest: true,
        });
      } catch (err) {
        logDebug(`Guest login error: ${err.message}`, 'error');
        guestText.setText('Error - Try again');
        guestBg.setInteractive({ useHandCursor: true });
        guestText.setInteractive({ useHandCursor: true });
        walletBg.setInteractive({ useHandCursor: true });
        walletText.setInteractive({ useHandCursor: true });
      }
    };

    guestBg.on('pointerdown', onGuestClick);
    guestText.on('pointerdown', onGuestClick);
    guestBg.on('pointerover', () => guestBg.setFillStyle(0x22c55e));
    guestBg.on('pointerout', () => guestBg.setFillStyle(0x4ade80));

    const walletBg = this.add.rectangle(width / 2, 370, 300, 60, 0xf6416c);
    walletBg.setStrokeStyle(3, 0xd6335c);

    const walletText = this.add.text(width / 2, 370, 'Connect Wallet', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    walletBg.setInteractive({ useHandCursor: true });
    walletText.setInteractive({ useHandCursor: true });

    const onWalletClick = async () => {
      guestBg.disableInteractive();
      guestText.disableInteractive();
      walletBg.disableInteractive();
      walletText.disableInteractive();

      try {
        const wallet = new WalletService();
        if (!wallet.isSupported()) {
          logDebug('MetaMask not detected', 'warn');
          walletText.setText('MetaMask required');
          walletBg.disableInteractive();
          walletText.disableInteractive();
          guestBg.setInteractive({ useHandCursor: true });
          guestText.setInteractive({ useHandCursor: true });
          return;
        }

        walletText.setText('Connecting...');
        logDebug('Requesting wallet connection...', 'info');
        const result = await wallet.connect();
        logDebug(`Wallet connected: ${result.account}`, 'info');

        walletText.setText('Pick username...');
        const username = await promptUsername('Pick your username', 'Choose a permanent username', false);
        if (!username) return;

        const session = await walletLogin(result.account, username);
        logDebug(`Wallet logged in: ${session.username}`, 'info');
        this.scene.start('KleeblattAdventure', {
          token: session.access_token,
          username: session.username,
          userId: session.user_id,
          walletAddress: session.wallet_address,
          isGuest: false,
        });
      } catch (err) {
        logDebug(`Wallet login error: ${err.message}`, 'error');
        walletText.setText('Error - Try again');
        walletBg.setInteractive({ useHandCursor: true });
        walletText.setInteractive({ useHandCursor: true });
        guestBg.setInteractive({ useHandCursor: true });
        guestText.setInteractive({ useHandCursor: true });
      }
    };

    walletBg.on('pointerdown', onWalletClick);
    walletText.on('pointerdown', onWalletClick);
    walletBg.on('pointerover', () => walletBg.setFillStyle(0xd6335c));
    walletBg.on('pointerout', () => walletBg.setFillStyle(0xf6416c));

    this.add.text(width / 2, 440, 'Your progress is saved automatically', {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#718096',
    }).setOrigin(0.5);

    this.add.text(width / 2, 540, 'Use WASD / Arrow keys to move', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#4a5568',
    }).setOrigin(0.5);

    logDebug('WelcomeScene created', 'info');

    this.tryAutoLogin();
  }

  async tryAutoLogin() {
    const session = getSession();
    if (!session || !session.access_token) return;

    try {
      logDebug('Auto-login: checking saved session...', 'info');
      await getProfile(session.access_token);
      logDebug(`Auto-login: ${session.username}`, 'info');
      this.scene.start('KleeblattAdventure', {
        token: session.access_token,
        username: session.username,
        userId: session.user_id,
        walletAddress: session.wallet_address,
        isGuest: session.is_guest,
      });
    } catch {
      logDebug('Auto-login: session expired', 'warn');
    }
  }
}
