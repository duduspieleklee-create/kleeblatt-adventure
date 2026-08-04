import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents } from '../core/GameEvents';
import InventorySystem from './InventorySystem';

interface LootDrop {
  item: string;
  chance: number;
}

interface LootTable {
  drops: LootDrop[];
  goldRange: { min: number; max: number };
}

interface LootTablesData {
  [enemyId: string]: LootTable;
}

import lootTablesData from '../data/loot-tables.json' with { type: 'json' };

export default class LootSystem {
  private scene: Phaser.Scene;
  private inventorySystem: InventorySystem | null = null;
  private lootTables: LootTablesData = lootTablesData as LootTablesData;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setInventorySystem(inventorySystem: InventorySystem): void {
    this.inventorySystem = inventorySystem;
  }

  loadLootTables(): void {
    this.lootTables = lootTablesData as LootTablesData;
  }

  getLootTable(enemyId: string): LootTable | undefined {
    return this.lootTables[enemyId];
  }

  dropLoot(enemyId: string): void {
    const table = this.lootTables[enemyId];
    if (!table) return;

    const droppedItems: string[] = [];

    for (const drop of table.drops) {
      if (Math.random() < drop.chance) {
        if (this.inventorySystem) {
          this.inventorySystem.addItem(drop.item, 1);
        }
        droppedItems.push(drop.item);
      }
    }

    const goldMin = table.goldRange.min;
    const goldMax = table.goldRange.max;
    const goldAmount = goldMin + Math.floor(Math.random() * (goldMax - goldMin + 1));

    const player = (this.scene as any).player;
    if (player && goldAmount > 0) {
      player.addGold(goldAmount);
    }

    gameBridge.emit(PhaserEvents.LOOT_DROPPED, {
      enemyId,
      items: droppedItems,
      gold: goldAmount,
    });
  }
}