import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents } from '../core/GameEvents';
import Player, { PlayerStats } from '../entities/Player';
import equipmentData from '../data/equipment.json' with { type: 'json' };

export type EquipmentSlot = 'weapon' | 'head' | 'chest' | 'legs' | 'ring' | 'amulet' | 'offhand';

interface EquipmentItem {
  id: string;
  label: string;
  slot: EquipmentSlot;
  stats: Partial<PlayerStats>;
  rarity: string;
}

export interface EquipmentSlots {
  weapon: EquipmentItem | null;
  head: EquipmentItem | null;
  chest: EquipmentItem | null;
  legs: EquipmentItem | null;
  ring: EquipmentItem | null;
  amulet: EquipmentItem | null;
  offhand: EquipmentItem | null;
}

export default class EquipmentSystem {
  private scene: Phaser.Scene;
  private slots: EquipmentSlots = {
    weapon: null,
    head: null,
    chest: null,
    legs: null,
    ring: null,
    amulet: null,
    offhand: null,
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private findEquipment(itemId: string): EquipmentItem | undefined {
    return (equipmentData as EquipmentItem[]).find(e => e.id === itemId);
  }

  equip(itemId: string): boolean {
    const item = this.findEquipment(itemId);
    if (!item) return false;

    const player = (this.scene as any).player as Player;
    if (!player) return false;

    const slot = item.slot;
    const oldItem = this.slots[slot];

    if (oldItem) {
      this.removeStats(oldItem, player);
    }

    this.slots[slot] = item;
    this.applyStats(item, player);

    gameBridge.emit(PhaserEvents.EQUIPMENT_CHANGED, { ...this.slots });
    gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED, { ...player.stats });
    return true;
  }

  unequip(slot: EquipmentSlot): boolean {
    const item = this.slots[slot];
    if (!item) return false;

    const player = (this.scene as any).player as Player;
    if (!player) return false;

    this.removeStats(item, player);
    this.slots[slot] = null;

    gameBridge.emit(PhaserEvents.EQUIPMENT_CHANGED, { ...this.slots });
    gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED, { ...player.stats });
    return true;
  }

  applyStats(item: EquipmentItem, player: Player): void {
    for (const [key, value] of Object.entries(item.stats)) {
      if (value && key in player.stats) {
        player.stats[key as keyof PlayerStats] += value;
      }
    }
  }

  removeStats(item: EquipmentItem, player: Player): void {
    for (const [key, value] of Object.entries(item.stats)) {
      if (value && key in player.stats) {
        player.stats[key as keyof PlayerStats] -= value;
      }
    }
  }

  getSlots(): EquipmentSlots {
    return { ...this.slots };
  }
}