#!/usr/bin/env node
/**
 * Seed helper – loads game-config.json and prints a summary.
 * Full DB seed (item templates, etc.) lands when the API schema is ready.
 *
 * Usage: npm run db:seed
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const configPath = resolve(root, "game-config.json");

if (!existsSync(configPath)) {
  console.error("[seed] game-config.json not found at", configPath);
  process.exit(1);
}

const raw = readFileSync(configPath, "utf8");
let config;
try {
  config = JSON.parse(raw);
} catch (err) {
  console.error("[seed] Invalid JSON in game-config.json:", err.message);
  process.exit(1);
}

const classes = config?.hero?.classes ? Object.keys(config.hero.classes) : [];
const enemies = config?.enemies?.archetypes
  ? Object.keys(config.enemies.archetypes)
  : [];
const lootTables = config?.lootTables ? Object.keys(config.lootTables) : [];

console.info("[seed] game-config.json OK");
console.info(`  hero classes : ${classes.join(", ") || "(none)"}`);
console.info(`  enemy types  : ${enemies.join(", ") || "(none)"}`);
console.info(`  loot tables  : ${lootTables.join(", ") || "(none)"}`);
console.info(
  "[seed] DB insert of item templates will run once migrations + seed service exist (P0/P1).",
);
console.info("[seed] Done.");
