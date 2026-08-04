import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents } from '../core/GameEvents';
import Player from '../entities/Player';
import InventorySystem from './InventorySystem';
import sammleHolzData from '../data/quests/sammle_holz.json' with { type: 'json' };
import ersteSchlachtData from '../data/quests/erste_schlacht.json' with { type: 'json' };
import minenAbenteuerData from '../data/quests/minen_abenteuer.json' with { type: 'json' };

interface QuestRequirement {
  collect?: { item: string; amount: number };
  kill?: { enemy: string; amount: number };
}

interface QuestRewards {
  xp?: number;
  gold?: number;
  item?: string;
}

interface QuestData {
  id: string;
  title: string;
  description: string;
  giver: string;
  requirements: QuestRequirement;
  rewards: QuestRewards;
}

interface QuestState {
  quest: QuestData;
  progress: { collect?: Record<string, number>; kill?: Record<string, number> };
  completed: boolean;
}

const ALL_QUESTS: QuestData[] = [
  sammleHolzData as QuestData,
  ersteSchlachtData as QuestData,
  minenAbenteuerData as QuestData,
];

export default class QuestSystem {
  private scene: Phaser.Scene;
  private activeQuests: Map<string, QuestState> = new Map();
  private inventorySystem: InventorySystem | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setInventorySystem(inventorySystem: InventorySystem): void {
    this.inventorySystem = inventorySystem;
  }

  startQuest(questData: QuestData): boolean {
    if (this.activeQuests.has(questData.id)) return false;

    this.activeQuests.set(questData.id, {
      quest: questData,
      progress: {
        collect: questData.requirements.collect ? {} : undefined,
        kill: questData.requirements.kill ? {} : undefined,
      },
      completed: false,
    });

    gameBridge.emit(PhaserEvents.QUEST_STARTED, {
      questId: questData.id,
      title: questData.title,
      description: questData.description,
    });

    return true;
  }

  addProgress(questId: string, amount: number = 1): void {
    const qs = this.activeQuests.get(questId);
    if (!qs || qs.completed) return;

    const req = qs.quest.requirements;

    if (req.collect) {
      if (!qs.progress.collect) qs.progress.collect = {};
      const current = qs.progress.collect[req.collect.item] || 0;
      qs.progress.collect[req.collect.item] = current + amount;
    }

    if (req.kill) {
      if (!qs.progress.kill) qs.progress.kill = {};
      const current = qs.progress.kill[req.kill.enemy] || 0;
      qs.progress.kill[req.kill.enemy] = current + amount;
    }

    this.checkCompletion(questId);

    gameBridge.emit(PhaserEvents.QUEST_PROGRESS, { questId });
  }

  collectItem(itemId: string): void {
    for (const [questId, qs] of this.activeQuests) {
      if (qs.completed) continue;
      if (qs.quest.requirements.collect && qs.quest.requirements.collect.item === itemId) {
        this.addProgress(questId, 1);
      }
    }
  }

  killEnemy(enemyId: string): void {
    for (const [questId, qs] of this.activeQuests) {
      if (qs.completed) continue;
      if (qs.quest.requirements.kill && qs.quest.requirements.kill.enemy === enemyId) {
        this.addProgress(questId, 1);
      }
    }
  }

  private checkCompletion(questId: string): void {
    const qs = this.activeQuests.get(questId);
    if (!qs || qs.completed) return;

    const req = qs.quest.requirements;

    if (req.collect) {
      const current = qs.progress.collect?.[req.collect.item] || 0;
      if (current >= req.collect.amount) {
        this.completeQuest(questId);
        return;
      }
    }

    if (req.kill) {
      const current = qs.progress.kill?.[req.kill.enemy] || 0;
      if (current >= req.kill.amount) {
        this.completeQuest(questId);
        return;
      }
    }
  }

  completeQuest(questId: string): void {
    const qs = this.activeQuests.get(questId);
    if (!qs || qs.completed) return;

    qs.completed = true;
    const player = (this.scene as { player?: Player }).player as Player;

    if (qs.quest.rewards.xp && player) {
      player.gainXp(qs.quest.rewards.xp);
    }
    if (qs.quest.rewards.gold && player) {
      player.addGold(qs.quest.rewards.gold);
    }
    if (qs.quest.rewards.item && this.inventorySystem) {
      this.inventorySystem.addItem(qs.quest.rewards.item, 1);
    }

    gameBridge.emit(PhaserEvents.QUEST_COMPLETED, {
      questId,
      title: qs.quest.title,
      rewards: qs.quest.rewards,
    });
  }

  getActiveQuests(): QuestState[] {
    return Array.from(this.activeQuests.values()).filter(qs => !qs.completed);
  }

  findQuest(questId: string): QuestData | undefined {
    return ALL_QUESTS.find(q => q.id === questId);
  }
}