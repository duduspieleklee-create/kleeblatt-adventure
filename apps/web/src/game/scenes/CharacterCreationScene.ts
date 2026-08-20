import Phaser from 'phaser';
import { TEXT_STYLES, UI_CONFIG } from '../ui/UIConstants';
import { log } from '../utils/logger';

type HeroClass = 'mage' | 'ranged' | 'melee';

interface ClassOption {
  id: HeroClass;
  label: string;
  description: string;
}

const CLASS_OPTIONS: ClassOption[] = [
  { id: 'melee', label: 'Nahkämpfer', description: 'Frontline, Dash, Schildwall' },
  { id: 'ranged', label: 'Fernkämpfer', description: 'Distanz, Kiting, Slow' },
  { id: 'mage', label: 'Magier', description: 'Distanzzauber, Burst, Blink' },
];

interface HeroResponse {
  userId: string;
  heroName: string;
  class: HeroClass;
  level: number;
  xp: number;
  equipped: Record<string, string>;
  starterItems: unknown[];
}

/**
 * CharacterCreationScene — hero name input + class selection.
 * On submit → POST /api/hero → MainMenuScene.
 */
export class CharacterCreationScene extends Phaser.Scene {
  private nameInput?: HTMLInputElement;
  private selectedClass: HeroClass | null = null;
  private classCards: Phaser.GameObjects.Text[] = [];
  private createBtn?: Phaser.GameObjects.Text;
  private errorText?: Phaser.GameObjects.Text;
  private busy = false;

  constructor() {
    super({ key: 'CharacterCreationScene' });
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);

    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add
      .text(cx, cy - 160, 'Create Your Hero', {
        ...TEXT_STYLES.menuTitle,
        fontSize: '28px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 125, 'Choose a name and class to begin your adventure', {
        ...TEXT_STYLES.small,
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    // Name input — DOM element positioned over canvas
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.placeholder = 'Hero name (2–20 characters)';
    this.nameInput.maxLength = 20;
    this.nameInput.style.cssText = `
      font-size: 18px;
      padding: 8px 12px;
      border: 2px solid #8b6914;
      border-radius: 6px;
      background: #2a2118;
      color: #f5e6c8;
      width: 300px;
      text-align: center;
      outline: none;
      font-family: ${UI_CONFIG.FONT_FAMILY};
    `;
    this.nameInput.autofocus = true;

    const inputDom = this.add.dom(cx, cy - 60, this.nameInput);
    void inputDom;

    // Class selection cards
    const cardSpacing = 140;
    const cardStartX = cx - cardSpacing;
    this.classCards = [];

    CLASS_OPTIONS.forEach((option, i) => {
      const cardX = cardStartX + i * cardSpacing;
      const cardY = cy + 30;

      const card = this.add
        .text(cardX, cardY, `${option.label}\n${option.description}`, {
          ...TEXT_STYLES.body,
          fontSize: '14px',
          align: 'center',
          color: '#888888',
          wordWrap: { width: 120 },
        })
        .setOrigin(0.5);

      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => this.selectClass(option.id));
      card.on('pointerover', () => {
        if (this.selectedClass !== option.id) card.setColor('#cccccc');
      });
      card.on('pointerout', () => {
        if (this.selectedClass !== option.id) card.setColor('#888888');
      });

      this.classCards.push(card);
    });

    // Create button
    this.createBtn = this.add
      .text(cx, cy + 120, 'Create Hero', {
        ...TEXT_STYLES.menuButton,
        fontSize: '20px',
        color: '#666666',
      })
      .setOrigin(0.5);

    this.createBtn.setInteractive({ useHandCursor: true });
    this.createBtn.on('pointerdown', () => void this.handleSubmit());
    this.createBtn.on('pointerover', () => {
      if (this.selectedClass && !this.busy) this.createBtn?.setColor('#88ffcc');
    });
    this.createBtn.on('pointerout', () => {
      if (this.selectedClass && !this.busy) this.createBtn?.setColor('#00ff88');
    });

    // Error text
    this.errorText = this.add
      .text(cx, cy + 170, '', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '14px',
        color: '#ff6b6b',
        align: 'center',
        wordWrap: { width: width - 80 },
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private selectClass(cls: HeroClass): void {
    if (this.busy) return;
    this.selectedClass = cls;

    // Update card styles
    CLASS_OPTIONS.forEach((option, i) => {
      const card = this.classCards[i];
      if (option.id === cls) {
        card.setColor('#00ff88');
      } else {
        card.setColor('#888888');
      }
    });

    // Enable create button
    this.createBtn?.setColor('#00ff88');
  }

  private async handleSubmit(): Promise<void> {
    if (this.busy || !this.selectedClass || !this.nameInput) return;

    const heroName = this.nameInput.value.trim();
    if (heroName.length < 2) {
      this.showError('Hero name must be 2–20 characters.');
      return;
    }

    this.busy = true;
    this.createBtn?.setText('Creating…');
    this.createBtn?.setColor('#888888');
    this.errorText?.setVisible(false);

    try {
      const res = await fetch('/api/hero', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroName, class: this.selectedClass }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        const msg = body?.error?.message ?? `Server error (${res.status})`;
        this.showError(msg);
        this.resetButton();
        return;
      }

      const hero = (await res.json()) as HeroResponse;
      log.info('[CharacterCreation] Hero created:', hero.heroName, hero.class);
      this.scene.start('MainMenuScene');
    } catch (e) {
      log.error('[CharacterCreation] Failed to create hero:', e);
      this.showError('Cannot reach server. Please check your connection.');
      this.resetButton();
    }
  }

  private resetButton(): void {
    this.busy = false;
    this.createBtn?.setText('Create Hero');
    if (this.selectedClass) {
      this.createBtn?.setColor('#00ff88');
    } else {
      this.createBtn?.setColor('#666666');
    }
  }

  private showError(msg: string): void {
    this.errorText?.setText(msg);
    this.errorText?.setVisible(true);
  }

  shutdown(): void {
    // Remove DOM input element
    if (this.nameInput?.parentNode) {
      this.nameInput.parentNode.removeChild(this.nameInput);
    }
    this.nameInput = undefined;
    this.selectedClass = null;
    this.classCards = [];
    this.busy = false;
  }
}
