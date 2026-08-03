#!/usr/bin/env node
/**
 * Seed: lädt game-config.json und schreibt die Item-Templates in Postgres,
 * falls die DB erreichbar ist (sonst nur Zusammenfassung).
 *
 * Usage: npm run db:seed
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const configPath = resolve(root, "game-config.json");

if (!existsSync(configPath)) {
  console.error("[seed] game-config.json not found at", configPath);
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const classes = config?.hero?.classes ? Object.keys(config.hero.classes) : [];
const enemies = config?.enemies?.archetypes ? Object.keys(config.enemies.archetypes) : [];
const lootTables = config?.lootTables ? Object.keys(config.lootTables) : [];

console.info("[seed] game-config.json OK");
console.info(`  hero classes : ${classes.join(", ") || "(none)"}`);
console.info(`  enemy types  : ${enemies.join(", ") || "(none)"}`);
console.info(`  loot tables  : ${lootTables.join(", ") || "(none)"}`);

const databaseUrl = process.env.DATABASE_URL ?? "";
if (!databaseUrl) {
  console.info("[seed] DATABASE_URL nicht gesetzt – DB-Seed übersprungen.");
  process.exit(0);
}

// Starter-Gear-Templates (P2) in item_templates schreiben.
const starterGear = config?.starterGear ?? {};
const templates = Object.values(starterGear)
  .flat()
  .map((item) => ({
    template_id: item.templateId,
    name: item.name,
    slot: item.slot,
    rarity: item.rarity,
    stats: item.stats ?? {},
    allowed_classes: item.allowedClasses ?? null,
    description: item.description ?? null,
    mint_candidate: false,
  }));

if (templates.length === 0) {
  console.info("[seed] Keine Starter-Gear-Templates in game-config.json.");
  process.exit(0);
}

const client = new pg.Client({ connectionString: databaseUrl });
try {
  await client.connect();
  await client.query(
    `CREATE TABLE IF NOT EXISTS item_templates (
      template_id text PRIMARY KEY,
      name text NOT NULL,
      slot text NOT NULL,
      rarity text NOT NULL,
      stats jsonb NOT NULL DEFAULT '{}',
      allowed_classes jsonb,
      description text,
      mint_candidate boolean NOT NULL DEFAULT false
    )`,
  );
  for (const t of templates) {
    await client.query(
      `INSERT INTO item_templates (template_id, name, slot, rarity, stats, allowed_classes, description, mint_candidate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (template_id) DO UPDATE SET
         name = EXCLUDED.name, slot = EXCLUDED.slot, rarity = EXCLUDED.rarity,
         stats = EXCLUDED.stats, allowed_classes = EXCLUDED.allowed_classes,
         description = EXCLUDED.description`,
      [
        t.template_id,
        t.name,
        t.slot,
        t.rarity,
        JSON.stringify(t.stats),
        JSON.stringify(t.allowed_classes),
        t.description,
        t.mint_candidate,
      ],
    );
  }
  console.info(`[seed] ${templates.length} Starter-Gear-Templates in item_templates geschrieben.`);
} catch (err) {
  console.error("[seed] DB-Fehler:", err.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
