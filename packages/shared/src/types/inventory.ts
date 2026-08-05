/** Runtime bag stacks (materials, consumables) — separate from unique equipment items. */

/** templateId → quantity */
export type InventoryStacks = Record<string, number>;

export interface InventoryStacksResponse {
  stacks: InventoryStacks;
  updatedAt: string | null;
}

export interface PutInventoryStacksRequest {
  stacks: InventoryStacks;
}
