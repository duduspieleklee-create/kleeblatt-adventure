/** Item lifecycle states (Web2 → secured → self-custody) */

export type ItemState =
  | "web2"
  | "pending_secure"
  | "secured"
  | "active_in_game"
  | "self_custody";

export type ItemSlot = "weapon" | "chest" | "head" | "legs" | "accessory";

export type ItemRarity = "common" | "uncommon" | "rare" | "epic";

export interface ItemTemplateRef {
  templateId: string;
  slot: ItemSlot;
  rarity: ItemRarity;
}

export interface InventoryItem {
  id: string;
  templateId: string;
  state: ItemState;
  slot: ItemSlot | null;
  equipped: boolean;
}
