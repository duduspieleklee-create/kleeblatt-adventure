/** Item lifecycle states (Web2 → secured → self-custody) */

import type { HeroClass } from "./hero.js";

export type ItemState = "web2" | "pending_secure" | "secured" | "active_in_game" | "self_custody";

export type ItemSlot = "weapon" | "chest" | "head" | "legs" | "accessory";

export type ItemRarity = "common" | "uncommon" | "rare" | "epic";

export interface ItemTemplateRef {
  templateId: string;
  slot: ItemSlot;
  rarity: ItemRarity;
}

/** Ein Item im Inventar eines Users (Spieler-Sicht). */
export interface InventoryItem {
  itemId: string;
  templateId: string;
  name: string;
  slot: ItemSlot | null;
  rarity: ItemRarity;
  state: ItemState;
  stats: Record<string, number>;
  allowedClasses: HeroClass[] | null;
  description: string | null;
  equipped: boolean;
}
