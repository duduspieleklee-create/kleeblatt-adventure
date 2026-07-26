import Phaser from 'phaser';
import { TREASURE_CATEGORIES, addTreasure, gameData } from './core/index.js';
import { submitScore, getProfile, linkWallet, updateUsername, clearSession } from './api.js';
import WalletService from './wallet.js';

const logDebug = (message, type = 'info') => {
  if (typeof window !== 'undefined' && window.__debugLog) {
    window.__debugLog(message, type);
  }
  console.log(`[${type}] ${message}`);
};

function promptUsername(title, desc, canSkip = false) {
  return new Promise((resolve) => {
    window._showUsernamePrompt(title, desc, canSkip, resolve);
  });
}

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
    this.walletAddress = null;
    this.scoreSubmitQueue = [];
    this.lastScoreSubmit = 0;
    this.highScore = 0;
    this.settingsOpen = false;
    this.settingsElements = [];
  }

  init(data) {
    this.token = data?.token || null;
    this.username = data?.username || 'Player';
    this.userId = data?.userId || null;
    this.isGuest = data?.isGuest !== false;
    this.walletAddress = data?.walletAddress || null;
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

      graphics.fillStyle(0xffffff, 1);
      graphics.fillRect(0, 0, 64, 64);
      graphics.generateTexture('spot', 64, 64);
      graphics.clear();
      logDebug('Scene preload complete', 'info');
    } catch (error) {
      logDebug(`preload error: ${error.message}`, 'error');
    }
  }

  create() {
    try {
      logDebug(`Scene create - User: ${this.username} (guest: ${this.isGuest})`, 'info');
      gameData.score = 0;
      gameData.collections = 0;
      gameData.achievements = [];
      gameData.treasures = [];
      this.treasures = [];
      this.celebrationComplete = false;
      this.scoreSubmitQueue = [];
      this.lastScoreSubmit = 0;
      this.settingsOpen = false;
      this.settingsElements = [];

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
      if (this.settingsOpen) return;

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

  refreshUserLabel() {
    if (this.userText) {
      const label = this.isGuest ? '' : '';
      this.userText.setText(`${this.username}${label}`);
    }
  }

  createUI() {
    const label = this.isGuest ? '' : '';
    this.userText = this.add.text(20, 10, `${this.username}${label}`, {
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

    const gearBg = this.add.rectangle(770, 20, 36, 36, 0x4a5568);
    gearBg.setStrokeStyle(2, 0x718096);
    gearBg.setInteractive({ useHandCursor: true });
    gearBg.setScrollFactor(0);

    const gearText = this.add.text(770, 20, '\u2699', {
      fontSize: '22px',
      color: '#e2e8f0',
    }).setOrigin(0.5).setScrollFactor(0);

    gearBg.on('pointerdown', () => this.toggleSettings());
    gearBg.on('pointerover', () => gearBg.setFillStyle(0x718096));
    gearBg.on('pointerout', () => gearBg.setFillStyle(0x4a5568));
  }

  toggleSettings() {
    if (this.settingsOpen) {
      this.closeSettings();
    } else {
      this.openSettings();
    }
  }

  openSettings() {
    this.settingsOpen = true;
    this.settingsElements = [];

    const w = this.scale.width;
    const h = this.scale.height;

    const dimmer = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6)
      .setDepth(50).setScrollFactor(0);
    dimmer.setInteractive();
    this.settingsElements.push(dimmer);

    const panelW = 320;
    const panelH = this.isGuest ? 300 : 320;
    const panel = this.add.rectangle(w / 2, h / 2, panelW, panelH, 0x1a1a2e)
      .setDepth(51).setScrollFactor(0);
    panel.setStrokeStyle(2, 0xf6416c);
    this.settingsElements.push(panel);

    const title = this.add.text(w / 2, h / 2 - panelH / 2 + 30, 'Settings', {
      fontSize: '24px',
      color: '#f6416c',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    this.settingsElements.push(title);

    let y = h / 2 - panelH / 2 + 75;

    const accountType = this.isGuest ? 'Guest Account' : 'Registered Account';
    const typeColor = this.isGuest ? '#fbbf24' : '#4ade80';
    const typeLine = this.add.text(w / 2, y, accountType, {
      fontSize: '14px',
      color: typeColor,
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    this.settingsElements.push(typeLine);

    y += 28;

    const userLine = this.add.text(w / 2, y, `Username: ${this.username}`, {
      fontSize: '16px',
      color: '#4ade80',
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    this.settingsElements.push(userLine);

    y += 30;

    if (this.walletAddress) {
      const shortAddr = this.walletAddress.slice(0, 6) + '...' + this.walletAddress.slice(-4);
      const walletLine = this.add.text(w / 2, y, `Wallet: ${shortAddr}`, {
        fontSize: '13px',
        color: '#a0aec0',
      }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
      this.settingsElements.push(walletLine);
      y += 30;
    }

    y += 10;

    if (!this.isGuest) {
      const changeNameBg = this.add.rectangle(w / 2, y, 240, 40, 0x4ade80)
        .setDepth(52).setScrollFactor(0);
      changeNameBg.setStrokeStyle(1, 0x22c55e);
      changeNameBg.setInteractive({ useHandCursor: true });
      const changeNameText = this.add.text(w / 2, y, 'Change Username', {
        fontSize: '16px',
        color: '#000',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(53).setScrollFactor(0);
      changeNameBg.on('pointerdown', () => this.handleChangeUsername(changeNameBg, changeNameText));
      changeNameBg.on('pointerover', () => changeNameBg.setFillStyle(0x22c55e));
      changeNameBg.on('pointerout', () => changeNameBg.setFillStyle(0x4ade80));
      this.settingsElements.push(changeNameBg, changeNameText);
      y += 50;
    }

    if (this.isGuest) {
      const linkBg = this.add.rectangle(w / 2, y, 240, 40, 0xf6416c)
        .setDepth(52).setScrollFactor(0);
      linkBg.setStrokeStyle(1, 0xd6335c);
      linkBg.setInteractive({ useHandCursor: true });
      const linkText = this.add.text(w / 2, y, 'Link Wallet', {
        fontSize: '16px',
        color: '#fff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(53).setScrollFactor(0);
      linkBg.on('pointerdown', () => this.handleLinkWallet(linkBg, linkText));
      linkBg.on('pointerover', () => linkBg.setFillStyle(0xd6335c));
      linkBg.on('pointerout', () => linkBg.setFillStyle(0xf6416c));
      this.settingsElements.push(linkBg, linkText);
      y += 50;
    }

    y += 10;

    const logoutBg = this.add.rectangle(w / 2, y, 200, 34, 0x718096)
      .setDepth(52).setScrollFactor(0);
    logoutBg.setInteractive({ useHandCursor: true });
    const logoutText = this.add.text(w / 2, y, 'Logout', {
      fontSize: '14px',
      color: '#fff',
    }).setOrigin(0.5).setDepth(53).setScrollFactor(0);
    logoutBg.on('pointerdown', () => this.handleLogout());
    logoutBg.on('pointerover', () => logoutBg.setFillStyle(0x8a9ab0));
    logoutBg.on('pointerout', () => logoutBg.setFillStyle(0x718096));
    this.settingsElements.push(logoutBg, logoutText);

    const closeBg = this.add.rectangle(w / 2, h / 2 + panelH / 2 - 25, 60, 30, 0x4a5568)
      .setDepth(52).setScrollFactor(0);
    closeBg.setInteractive({ useHandCursor: true });
    const closeText = this.add.text(w / 2, h / 2 + panelH / 2 - 25, 'Close', {
      fontSize: '14px',
      color: '#e2e8f0',
    }).setOrigin(0.5).setDepth(53).setScrollFactor(0);
    closeBg.on('pointerdown', () => this.closeSettings());
    this.settingsElements.push(closeBg, closeText);
  }

  closeSettings() {
    this.settingsOpen = false;
    this.settingsElements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.settingsElements = [];
  }

  async handleChangeUsername(bg, text) {
    bg.disableInteractive();
    text.setText('...');
    try {
      const username = await promptUsername('New username', 'Pick a new permanent username', false);
      if (!username) {
        text.setText('Change Username');
        bg.setInteractive({ useHandCursor: true });
        return;
      }
      const result = await updateUsername(this.token, username);
      this.username = result.username;
      this.refreshUserLabel();
      this.closeSettings();
      logDebug(`Username changed to: ${this.username}`, 'info');
    } catch (err) {
      logDebug(`Username change error: ${err.message}`, 'error');
      text.setText('Error');
    }
  }

  async handleLinkWallet(bg, text) {
    bg.disableInteractive();
    try {
      const wallet = new WalletService();
      if (!wallet.isSupported()) {
        text.setText('MetaMask required');
        return;
      }
      text.setText('Connecting...');
      const result = await wallet.connect();
      logDebug(`Wallet connected for linking: ${result.account}`, 'info');
      await new Promise(r => setTimeout(r, 500));

      const username = await promptUsername('Pick your username', 'Choose a permanent username to become registered', false);
      if (!username) {
        text.setText('Link Wallet');
        bg.setInteractive({ useHandCursor: true });
        return;
      }
      text.setText('Linking...');

      const session = await linkWallet(this.token, result.account, username);
      this.token = session.access_token;
      this.username = session.username;
      this.walletAddress = session.wallet_address;
      this.isGuest = session.is_guest;
      this.refreshUserLabel();
      this.closeSettings();
      logDebug(`Wallet linked. Now registered as: ${this.username}`, 'info');
    } catch (err) {
      logDebug(`Link wallet error: ${err.message}`, 'error');
      text.setText('Error - Try again');
    }
  }

  handleLogout() {
    clearSession();
    this.closeSettings();
    this.scene.start('WelcomeScene');
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

      const treasure = this.physics.add.sprite(x, y, 'treasure');
      treasure.setDisplaySize(30, 30);
      treasure.setData('categoryId', categoryId);
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
