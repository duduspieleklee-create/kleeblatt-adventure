/** In-Memory-Fallback-Store (Prototyp ohne Postgres). Gemeinsam genutzt von users/heroes/items. */

import type { Hero, InventoryItem, InventoryStacks, OnboardingStatus, SessionUser } from "@kleeblatt/shared";

export const memUsers = new Map<string, SessionUser>();
/** Password hashes for email users (in-memory fallback, keyed by userId). */
export const memPasswordHashes = new Map<string, string>();
export const memHeroes = new Map<string, Hero>();
export const memItems = new Map<string, { ownerId: string; item: InventoryItem }>();

/** Mock-Wallet je User (P3/P9) – stabile Adresse pro User. */
export const memWallets = new Map<
  string,
  { address: string; status: "pending" | "ready" | "disconnected"; provider: string }
>();

/** Geöffnete Kisten je User (Fallback ohne Postgres). Key: `${userId}:${chestId}` → ISO-Datum. */
export const memChestOpens = new Map<string, string>();

/** Onboarding-Status je User (P11) */
export const memOnboardings = new Map<string, OnboardingStatus>();

/** Material/consumable stacks je User (Rucksack). */
export const memInventoryStacks = new Map<
  string,
  { stacks: InventoryStacks; updatedAt: string }
>();
