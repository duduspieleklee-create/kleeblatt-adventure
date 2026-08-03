/** Drizzle-Schema: users, heroes, items, item_templates (siehe docs/architecture/23-db-schema.md) */

import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  picture: text("picture"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const heroes = pgTable("heroes", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
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
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
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

export type UserRow = typeof users.$inferSelect;
export type HeroRow = typeof heroes.$inferSelect;
export type ItemRow = typeof items.$inferSelect;
export type ItemTemplateRow = typeof itemTemplates.$inferSelect;
