import Phaser from 'phaser';
import { getDailyLeaderboard, getDailyAwards, getLeaderpoints } from './api.js';

const logDebug = (message, type = 'info') => {
  if (typeof window !== 'undefined' && window.__debugLog) {
    window.__debugLog(message, type);
  }
};

export default class DailyLeaderboard extends Phaser.Scene {
  constructor() {
    super('DailyLeaderboard');
    this.elements = [];
    this.tab = 'daily';
  }

  init(data) {
    this.token = data?.token || null;
    this.username = data?.username || 'Player';
  }

  create() {
    const { width, height } = this.scale;

    const dimmer = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setDepth(0).setScrollFactor(0);
    dimmer.setInteractive();
    dimmer.on('pointerdown', () => this.close());
    this.elements.push(dimmer);

    const panelW = 460;
    const panelH = 480;
    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x1a1a2e)
      .setDepth(1).setScrollFactor(0);
    panel.setStrokeStyle(2, 0xf6416c);
    panel.setInteractive();
    this.elements.push(panel);

    let labels = this.elements;

    const title = this.add.text(width / 2, height / 2 - panelH / 2 + 22, 'Leaderboard', {
      fontSize: '22px',
      color: '#f6416c',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2);
    labels.push(title);

    const AWARD_AMOUNTS = [100, 80, 60, 50, 40, 30, 20, 15, 10, 5];

    const closeBg = this.add.rectangle(width / 2 + panelW / 2 - 18, height / 2 - panelH / 2 + 18, 28, 28, 0x4a5568).setDepth(2);
    closeBg.setInteractive({ useHandCursor: true });
    const closeX = this.add.text(width / 2 + panelW / 2 - 18, height / 2 - panelH / 2 + 18, 'X', {
      fontSize: '16px', color: '#e2e8f0', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);
    closeBg.on('pointerdown', () => this.close());
    labels.push(closeBg, closeX);

    const tabY = height / 2 - panelH / 2 + 55;
    const dailyTab = this.add.text(width / 2 - 60, tabY, 'Daily', {
      fontSize: '16px', color: '#4ade80', fontStyle: 'bold',
      backgroundColor: '#00000080', padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true });

    const pointsTab = this.add.text(width / 2 + 60, tabY, 'Leaderpoints', {
      fontSize: '16px', color: '#a0aec0',
      backgroundColor: '#00000080', padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true });

    dailyTab.on('pointerdown', () => {
      this.tab = 'daily';
      dailyTab.setColor('#4ade80');
      pointsTab.setColor('#a0aec0');
      this.clearContent();
      this.loadDaily();
    });

    pointsTab.on('pointerdown', () => {
      this.tab = 'points';
      dailyTab.setColor('#a0aec0');
      pointsTab.setColor('#4ade80');
      this.clearContent();
      this.loadLeaderpoints();
    });

    labels.push(dailyTab, pointsTab);
    this.contentLabels = [];

    this.loadDaily();
  }

  clearContent() {
    this.contentLabels.forEach(el => { if (el && el.destroy) el.destroy(); });
    this.contentLabels = [];
  }

  async loadDaily() {
    const AWARD_AMOUNTS = [100, 80, 60, 50, 40, 30, 20, 15, 10, 5];
    const { width, height } = this.scale;
    const panelH = 480;
    const y0 = height / 2 - panelH / 2 + 90;

    try {
      const [daily, awards] = await Promise.all([
        getDailyLeaderboard(),
        getDailyAwards(),
      ]);

      const awardedMap = {};
      awards.forEach(a => { awardedMap[a.rank] = a; });

      if (daily.length === 0) {
        const empty = this.add.text(width / 2, y0 + 60, 'No scores yet today.', {
          fontSize: '15px', color: '#718096',
        }).setOrigin(0.5).setDepth(2);
        this.contentLabels.push(empty);
        return;
      }

      this.add.text(width / 2, y0 - 10, 'Today\'s Top 50', {
        fontSize: '14px', color: '#a0aec0',
      }).setOrigin(0.5).setDepth(2);

      const maxShow = Math.min(daily.length, 10);
      const lineH = 22;
      const startY = y0 + 15;

      // Header
      const header = this.add.text(width / 2 - 170, startY, '#  Player', {
        fontSize: '13px', color: '#718096', fontStyle: 'bold',
      }).setDepth(2);
      const ptsHeader = this.add.text(width / 2 + 140, startY, 'Pts', {
        fontSize: '13px', color: '#718096', fontStyle: 'bold',
      }).setDepth(2);
      this.contentLabels.push(header, ptsHeader);

      for (let i = 0; i < maxShow; i++) {
        const entry = daily[i];
        const y = startY + 20 + i * lineH;
        const isMe = entry.username === this.username;
        const color = isMe ? '#4ade80' : '#e2e8f0';
        const award = awardedMap[entry.rank];
        const coinStr = award ? ` +${award.coins_awarded} KLB` : '';

        const rankColor = entry.rank <= 3 ? '#fbbf24' : '#718096';
        const rankTxt = this.add.text(width / 2 - 170, y, `${entry.rank}. ${entry.username}${coinStr}`, {
          fontSize: '13px', color, fontStyle: isMe ? 'bold' : 'normal',
        }).setDepth(2);
        const ptsTxt = this.add.text(width / 2 + 140, y, `${entry.points_today}`, {
          fontSize: '13px', color: rankColor, fontStyle: 'bold',
        }).setDepth(2);
        this.contentLabels.push(rankTxt, ptsTxt);
      }
    } catch (err) {
      logDebug(`Daily leaderboard error: ${err.message}`, 'error');
      const errorText = this.add.text(width / 2, y0 + 60, 'Failed to load', {
        fontSize: '14px', color: '#ef4444',
      }).setOrigin(0.5).setDepth(2);
      this.contentLabels.push(errorText);
    }
  }

  async loadLeaderpoints() {
    const AWARD_AMOUNTS = [100, 80, 60, 50, 40, 30, 20, 15, 10, 5];
    const { width, height } = this.scale;
    const panelH = 480;
    const y0 = height / 2 - panelH / 2 + 90;

    try {
      const data = await getLeaderpoints();

      if (data.length === 0) {
        const empty = this.add.text(width / 2, y0 + 60, 'No leaderpoints awarded yet.', {
          fontSize: '15px', color: '#718096',
        }).setOrigin(0.5).setDepth(2);
        this.contentLabels.push(empty);
        return;
      }

      this.add.text(width / 2, y0 - 10, 'All-Time Leaderpoints (KLB)', {
        fontSize: '14px', color: '#a0aec0',
      }).setOrigin(0.5).setDepth(2);

      const maxShow = Math.min(data.length, 20);
      const lineH = 22;
      const startY = y0 + 15;

      for (let i = 0; i < maxShow; i++) {
        const entry = data[i];
        const y = startY + i * lineH;
        const isMe = entry.username === this.username;
        const color = isMe ? '#4ade80' : '#e2e8f0';
        const rankColor = entry.rank <= 3 ? '#fbbf24' : '#718096';

        const rankTxt = this.add.text(width / 2 - 170, y, `${entry.rank}. ${entry.username}`, {
          fontSize: '13px', color, fontStyle: isMe ? 'bold' : 'normal',
        }).setDepth(2);
        const ptsTxt = this.add.text(width / 2 + 140, y, `${entry.coins} KLB`, {
          fontSize: '13px', color: rankColor, fontStyle: 'bold',
        }).setDepth(2);
        this.contentLabels.push(rankTxt, ptsTxt);
      }
    } catch (err) {
      logDebug(`Leaderpoints error: ${err.message}`, 'error');
      const errorText = this.add.text(width / 2, y0 + 60, 'Failed to load', {
        fontSize: '14px', color: '#ef4444',
      }).setOrigin(0.5).setDepth(2);
      this.contentLabels.push(errorText);
    }
  }

  close() {
    this.elements.forEach(el => { if (el && el.destroy) el.destroy(); });
    this.contentLabels.forEach(el => { if (el && el.destroy) el.destroy(); });
    this.scene.start('KleeblattAdventure', {
      token: this.token,
      username: this.username,
    });
  }
}
