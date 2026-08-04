import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents } from '../core/GameEvents';
import Player from '../entities/Player';
import itemsData from '../data/items.json' with { type: 'json' };

interface ItemDef {
  id: string;
  label: string;
  type: string;
  stackable: boolean;
  maxStack: number;
  effect?: string;
}

type ItemsData = ItemDef[];

export default class InventorySystem {
  private scene: Phaser.Scene;
  private slots: Record<string, number> = {};

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private findItem(itemId: string): ItemDef | undefined {
    return (itemsData as ItemsData).find(i => i.id === itemId);
  }

  addItem(itemId: string, amount: number = 1): boolean {
    const item = this.findItem(itemId);
    if (!item) return false;

    if (!item.stackable) {
      if (this.slots[itemId] && this.slots[itemId] >= 1) return false;
      this.slots[itemId] = Math.min(amount, item.maxStack);
    } else {
      const current = this.slots[itemId] || 0;
      const space = item.maxStack - current;
      if (space <= 0) return false;
      this.slots[itemId] = current + Math.min(amount, space);
    }

    gameBridge.emit(PhaserEvents.INVENTORY_UPDATED, { ...this.slots });
    return true;
  }

  removeItem(itemId: string, amount: number = 1): boolean {
    if (!this.slots[itemId]) return false;

    const newAmount = this.slots[itemId] - amount;
    if (newAmount <= 0) {
      delete this.slots[itemId];
    } else {
      this.slots[itemId] = newAmount;
    }

    gameBridge.emit(PhaserEvents.INVENTORY_UPDATED, { ...this.slots });
    return true;
  }

  hasItem(itemId: string, amount: number = 1): boolean {
    return (this.slots[itemId] || 0) >= amount;
  }

  useItem(itemId: string): boolean {
    const item = this.findItem(itemId);
    if (!item || !item.effect) return false;
    if (!this.hasItem(itemId, 1)) return false;

    const player = (this.scene as any).player as Player;
    if (!player) return false;

    const [type, valueStr] = item.effect.split('_');
    const value = parseInt(valueStr, 10);

    switch (type) {
      case 'heal':
        player.heal(value);
        break;
      case 'mana':
        player.stats.mana = Math.min(player.stats.maxMana, player.stats.mana + value);
        gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED, { ...player.stats });
        break;
      case 'stamina':
        player.stats.stamina = Math.min(player.stats.maxStamina, player.stats.stamina + value);
        gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED, { ...player.stats });
        break;
    }

    this.removeItem(itemId, 1);
    return true;
  }

  getSlots(): Record<string, number> {
    return { ...this.slots };
  }
}