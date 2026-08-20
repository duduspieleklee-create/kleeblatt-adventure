/** Drizzle-Schema: profiles, heroes, items, item_templates, wallets, user_onboarding, inventory_stacks
 *
 * NOTE: The old `users` table has been migrated into Supabase's `auth.users`.
 * Game-specific user data now lives in `profiles` (1:1 with auth.users).
 * All user_id columns are now uuid (previously text).
 */

import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid as pgUuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const walletStatusEnum = ["pending", "ready", "disconnected"] as const;
export type WalletStatus = (typeof walletStatusEnum)[number];

/** profiles: game-specific user data, 1:1 with auth.users (Supabase Auth). */
export const profiles = pgTable("profiles", {
  id: pgUuid("id").primaryKey(),
  username: text("username"),
  walletAddress: text("wallet_address").unique(),
  level: integer("level").notNull().default(1),
  gold: integer("gold").notNull().default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const heroes = pgTable("heroes", {
  userId: pgUuid("user_id").primaryKey(),
  heroName: text("hero_name").notNull(),
  class: text("class").notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  /** jsonb: { slot: itemId } */
  equipped: jsonb("equipped").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const items = pgTable("items", {
  id: text("id").primaryKey(),
  userId: pgUuid("user_id").notNull(),
  templateId: text("template_id").notNull(),
  name: text("name").notNull(),
  slot: text("slot"),
  rarity: text("rarity").notNull(),
  state: text("state").notNull(),
  stats: jsonb("stats").notNull().default({}),
  allowedClasses: jsonb("allowed_classes"),
  description: text("description"),
  equipped: boolean("equipped").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const itemTemplates = pgTable("item_templates", {
  templateId: text("template_id").primaryKey(),
  name: text("name").notNull(),
  slot: text("slot").notNull(),
  rarity: text("rarity").notNull(),
  stats: jsonb("stats").notNull().default({}),
  allowedClasses: jsonb("allowed_classes"),
  description: text("description"),
  mintCandidate: boolean("mint_candidate").notNull().default(false),
});

/** Mock-Wallet: 1:1 pro User (docs/architecture/23-db-schema.md, P3) */
export const wallets = pgTable("wallets", {
  userId: pgUuid("user_id").primaryKey(),
  address: text("address").notNull(),
  /** interne ID beim MPC-Provider (nur Mock: leer) */
  providerRef: text("provider_ref"),
  status: text("status", { enum: walletStatusEnum }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Kisten-Öffnungen: einmalig pro Spieler (docs/architecture/24-api-contract.md §2.9) */
export const chestOpens = pgTable(
  "chest_opens",
  {
    userId: pgUuid("user_id").notNull(),
    chestId: text("chest_id").notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("chest_opens_user_chest_unique").on(t.userId, t.chestId)],
);

/** Onboarding: Pfad-Wahl + Intro-Fortschritt (docs/architecture/11-onboarding-journey.md) */
export const userOnboardings = pgTable("user_onboarding", {
  userId: pgUuid("user_id").primaryKey(),
  /** "casual" (Neuling) oder "expert" (Experte) */
  path: text("path").notNull().default("casual"),
  /** Intro abgeschlossen? */
  introCompleted: boolean("intro_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Rucksack-Stacks: templateId → quantity (Materialien, Tränke). */
export const inventoryStacks = pgTable("inventory_stacks", {
  userId: pgUuid("user_id").primaryKey(),
  /** jsonb: { [templateId]: number } */
  stacks: jsonb("stacks").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProfileRow = typeof profiles.$inferSelect;

/**
 * Compatibility: the old `users` table has been renamed to `users_old_backup`
 * by migration 0005. We keep a Drizzle definition so existing API services
 * (users.ts, auth.ts) continue to work during the Supabase Auth transition.
 * New code should use `profiles` + Supabase Auth instead.
 */
export const usersOldBackup = pgTable("users_old_backup", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  picture: text("picture"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof usersOldBackup.$inferSelect;
export type HeroRow = typeof heroes.$inferSelect;
export type ItemRow = typeof items.$inferSelect;
export type ItemTemplateRow = typeof itemTemplates.$inferSelect;
export type WalletRow = typeof wallets.$inferSelect;
export type UserOnboardingRow = typeof userOnboardings.$inferSelect;
export type ChestOpenRow = typeof chestOpens.$inferSelect;
export type InventoryStacksRow = typeof inventoryStacks.$inferSelect;
