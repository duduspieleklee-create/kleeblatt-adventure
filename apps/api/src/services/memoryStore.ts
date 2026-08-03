/** In-Memory-Fallback-Store (Prototyp ohne Postgres). Gemeinsam genutzt von users/heroes/items. */

import type { Hero, InventoryItem, SessionUser } from "@kleeblatt/shared";

export const memUsers = new Map<string, SessionUser>();
export const memHeroes = new Map<string, Hero>();
export const memItems = new Map<string, { ownerId: string; item: InventoryItem }>();
