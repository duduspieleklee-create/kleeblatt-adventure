/** Migrations-Runner: wendet Drizzle-Migrationen an, wenn die DB erreichbar ist. */

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, isDbAvailable } from "./client.js";

const here = dirname(fileURLToPath(import.meta.url));
// src/db → apps/api/drizzle
export const migrationsFolder = resolve(here, "../../drizzle");

export async function runMigrationsIfAvailable(): Promise<boolean> {
  if (!(await isDbAvailable())) return false;
  const db = getDb();
  if (!db) return false;
  try {
    await migrate(db, { migrationsFolder });
    return true;
  } catch (err) {
    console.warn(
      `[db] Migration fehlgeschlagen: ${String((err as Error)?.message ?? err).slice(0, 200)}`,
    );
    return false;
  }
}
