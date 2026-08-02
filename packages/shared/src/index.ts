/**
 * @kleeblatt/shared
 * Shared types and constants for API + Web.
 */

export type { HeroClass, Hero } from "./types/hero.js";
export { HERO_CLASSES } from "./types/hero.js";

export type { ItemState, ItemSlot, ItemRarity, ItemTemplateRef, InventoryItem } from "./types/item.js";

export type { HealthResponse, ApiErrorBody } from "./types/api.js";

export { API_DEFAULT_PORT, WEB_DEFAULT_PORT, PROTOTYPE_MAP_ID } from "./constants/index.js";
