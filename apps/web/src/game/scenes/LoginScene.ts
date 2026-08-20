import Phaser from 'phaser';
import { TEXT_STYLES, UI_CONFIG } from '../ui/UIConstants';
import { log } from '../utils/logger';

interface MeResponse {
  userId: string;
  email: string;
  displayName: string | null;
  picture: string | null;
  hero: { heroName: string; class: string; level: number } | null;
}

/**
 * LoginScene — auth gate. Checks /api/me on create().
 * If authenticated + has hero → MainMenuScene.
 * If authenticated + no hero → CharacterCreationScene.
 * If not authenticated → shows Google login button.
 */
export class LoginScene extends Phaser.Scene {
  private statusText?: Phaser.GameObjects.Text;
  private errorText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LoginScene' });
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);

    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add
      .text(cx, cy - 100, 'Kleeblatt Adventure', {
        ...TEXT_STYLES.menuTitle,
        fontSize: '32px',
        align: 'center',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(cx, cy - 20, 'Checking login…', {
        ...TEXT_STYLES.body,
        fontSize: '16px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.errorText = this.add
      .text(cx, cy + 120, '', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '14px',
        color: '#ff6b6b',
        align: 'center',
        wordWrap: { width: width - 80 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    // Check for ?auth=error redirect param
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    if (authParam === 'error') {
      const reason = params.get('reason') ?? 'unknown';
      this.showError(`Login failed: ${reason}. Please try again.`);
      // Clean the URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    void this.checkAuth();
  }

  private async checkAuth(): Promise<void> {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });

      if (res.status === 401) {
        this.showLoginUI();
        return;
      }

      if (!res.ok) {
        this.showError('Server error. Please try again later.');
        return;
      }

      const me = (await res.json()) as MeResponse;
      log.info('[LoginScene] Authenticated as', me.email);

      if (me.hero) {
        log.info('[LoginScene] Hero exists, going to MainMenu');
        this.scene.start('MainMenuScene');
      } else {
        log.info('[LoginScene] No hero, going to CharacterCreation');
        this.scene.start('CharacterCreationScene');
      }
    } catch (e) {
      log.error('[LoginScene] Failed to check auth:', e);
      this.showError('Cannot reach server. Please check your connection.');
    }
  }

  private showLoginUI(): void {
    const { width, height } = this.scale.gameSize;
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);

    this.statusText?.setText('Welcome, adventurer!');
    this.statusText?.setColor('#f5e6c8');

    // Google login button
    const googleBtn = this.add
      .text(cx, cy + 20, 'Login with Google', {
        ...TEXT_STYLES.menuButton,
        fontSize: '20px',
      })
      .setOrigin(0.5);

    googleBtn.setInteractive({ useHandCursor: true });
    googleBtn.on('pointerdown', () => {
      window.location.href = '/api/auth/google';
    });
    googleBtn.on('pointerover', () => googleBtn.setColor('#88ffcc'));
    googleBtn.on('pointerout', () => googleBtn.setColor('#00ff88'));

    // Dev login button (only in dev mode)
    if (import.meta.env.DEV) {
      const devBtn = this.add
        .text(cx, cy + 70, 'Dev Login', {
          ...TEXT_STYLES.small,
          color: '#888888',
        })
        .setOrigin(0.5);

      devBtn.setInteractive({ useHandCursor: true });
      devBtn.on('pointerdown', () => {
        window.location.href = '/api/auth/dev-login';
      });
      devBtn.on('pointerover', () => devBtn.setColor('#aaaaaa'));
      devBtn.on('pointerout', () => devBtn.setColor('#888888'));
    }
  }

  private showError(msg: string): void {
    this.statusText?.setVisible(false);
    this.errorText?.setText(msg);
    this.errorText?.setVisible(true);
  }
}
