import Phaser from 'phaser';
import { QuestManager, Quest } from '../managers/QuestManager';
import { QuestHUD } from '../ui/QuestHUD';
import { TEXT_STYLES, UI_CONFIG } from '../ui/UIConstants';
import { InputEvents } from '../input/InputEvents';
import { DeviceDetector } from '../input/DeviceDetector';
import { getUIAnchors, TOUCH_TARGET_MIN } from '../ui/UIScale';

export type UISceneInitData = {
  questManager: QuestManager;
  questsData: Record<string, Quest>;
  worldSceneKey?: string;
};

/**
 * Screen-space UI — QuestHUD, chrome, mobile action buttons.
 * Layout only on RESIZE (no per-frame scaling).
 */
export class UIScene extends Phaser.Scene {
  private questHUD?: QuestHUD;
  private versionText?: Phaser.GameObjects.Text;
  // questbookBtn removed — questbook icon no longer displayed
  // interactBtn removed — Talk button no longer displayed
  private worldSceneKey = 'IslandScene';
  private questManager?: QuestManager;
  private showMobileControls = false;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: UISceneInitData): void {
    this.questManager = data.questManager;
    this.worldSceneKey = data.worldSceneKey ?? 'IslandScene';
  }

  create(data: UISceneInitData): void {
    const questManager = data.questManager ?? this.questManager;
    const questsData = data.questsData ?? {};

    if (!questManager) {
      console.error('[UIScene] Missing questManager — aborting UI');
      return;
    }

    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setZoom(1);

    this.showMobileControls = DeviceDetector.isTouchCapable(this.game);

    this.questHUD = new QuestHUD(this, questManager, questsData);
    this.createChrome();
    this.relayout();

    this.scale.on(Phaser.Scale.Events.RESIZE, this.relayout, this);

    this.events.on(InputEvents.OPEN_QUESTBOOK, this.onOpenQuestbook, this);
    this.events.on(InputEvents.CANCEL, this.onCancel, this);

    const world = this.scene.get(this.worldSceneKey);
    if (world) {
      world.events.on(InputEvents.OPEN_QUESTBOOK, this.onOpenQuestbook, this);
      world.events.on(InputEvents.CANCEL, this.onCancel, this);
    }

    if (import.meta.env.DEV) {
      console.info('[UIScene] ready; mobile controls:', this.showMobileControls);
    }
  }

  private createChrome(): void {
    this.versionText = this.add
      .text(0, 0, String(import.meta.env.GAME_VERSION ?? ''), {
        ...TEXT_STYLES.small,
        fontSize: '11px',
        color: '#888888',
      })
      .setScrollFactor(0)
      .setDepth(10002)
      .setAlpha(0.8);
  }

  private relayout = (): void => {
    const { width, height } = this.scale.gameSize;
    const anchors = getUIAnchors(width, height);

    if (this.versionText) {
      this.versionText.setPosition(
        Math.round(UI_CONFIG.MARGIN / 2),
        Math.round(height - 18),
      );
    }

    this.questHUD?.resize();
  };

  private onOpenQuestbook(): void {
    this.questHUD?.toggleQuestbook();
  }

  private onCancel(): void {
    this.questHUD?.closeQuestbook();
  }

  shutdown(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.relayout, this);
    this.events.off(InputEvents.OPEN_QUESTBOOK, this.onOpenQuestbook, this);
    this.events.off(InputEvents.CANCEL, this.onCancel, this);

    const world = this.scene.get(this.worldSceneKey);
    if (world) {
      world.events.off(InputEvents.OPEN_QUESTBOOK, this.onOpenQuestbook, this);
      world.events.off(InputEvents.CANCEL, this.onCancel, this);
    }

    this.questHUD?.shutdown();
    this.questHUD = undefined;
    this.versionText?.destroy();
  }
}
