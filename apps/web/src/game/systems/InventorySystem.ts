import { gameBridge } from "../../lib/gameBridge";
import { PhaserEvents } from "../core/GameEvents";
import Player from "../entities/Player";
import itemsData from "../data/items.json" with { type: "json" };

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
  private readonly onHydrate = (payload: { stacks: Record<string, number> }) => {
    this.slots = { ...payload.stacks };
    this.notify();
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    gameBridge.on("inventory:hydrate", this.onHydrate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameBridge.off("inventory:hydrate", this.onHydrate);
    });
  }

  private findItem(itemId: string): ItemDef | undefined {
    return (itemsData as ItemsData).find((i) => i.id === itemId);
  }

  private notify(): void {
    // Legacy UI event (string key used by some components)
    gameBridge.emit(PhaserEvents.INVENTORY_UPDATED as "inventory:updated", {
      stacks: { ...this.slots },
    });
    // Persistence contract
    gameBridge.emit("inventory:updated", { stacks: { ...this.slots } });
  }

  addItem(itemId: string, amount: number = 1): boolean {
    const item = this.findItem(itemId);
    if (!item) return false;

    if (!item.stackable) {
      if (this.slots[itemId] && this.slots[itemId]! >= 1) return false;
      this.slots[itemId] = Math.min(amount, item.maxStack);
    } else {
      const current = this.slots[itemId] || 0;
      const space = item.maxStack - current;
      if (space <= 0) return false;
      this.slots[itemId] = current + Math.min(amount, space);
    }

    this.notify();
    return true;
  }

  removeItem(itemId: string, amount: number = 1): boolean {
    if (!this.slots[itemId]) return false;

    const newAmount = this.slots[itemId]! - amount;
    if (newAmount <= 0) {
      delete this.slots[itemId];
    } else {
      this.slots[itemId] = newAmount;
    }

    this.notify();
    return true;
  }

  hasItem(itemId: string, amount: number = 1): boolean {
    return (this.slots[itemId] || 0) >= amount;
  }

  useItem(itemId: string): boolean {
    const item = this.findItem(itemId);
    if (!item || !item.effect) return false;
    if (!this.hasItem(itemId, 1)) return false;

    const player = (this.scene as { player?: Player }).player as Player;
    if (!player) return false;

    const [type, valueStr] = item.effect.split("_");
    const value = parseInt(valueStr ?? "0", 10);

    switch (type) {
      case "heal":
        player.heal(value);
        break;
      case "mana":
        player.stats.mana = Math.min(player.stats.maxMana, player.stats.mana + value);
        gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED as never, { ...player.stats } as never);
        break;
      case "stamina":
        player.stats.stamina = Math.min(player.stats.maxStamina, player.stats.stamina + value);
        gameBridge.emit(PhaserEvents.PLAYER_STATS_UPDATED as never, { ...player.stats } as never);
        break;
    }

    this.removeItem(itemId, 1);
    return true;
  }

  getSlots(): Record<string, number> {
    return { ...this.slots };
  }

  setSlots(stacks: Record<string, number>): void {
    this.slots = { ...stacks };
    this.notify();
  }
}
