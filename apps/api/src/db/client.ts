/** DB-Client (Drizzle + pg). Fällt auf null zurück, wenn keine DATABASE_URL gesetzt oder erreichbar ist. */

import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

let pool: pg.Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;
let probeState: boolean | null = null;

export function getDb(): NodePgDatabase<typeof schema> | null {
  if (!env.databaseUrl) return null;
  if (!db) {
    pool = new pg.Pool({
      connectionString: env.databaseUrl,
      max: 5,
      connectionTimeoutMillis: 1500,
      idleTimeoutMillis: 10_000,
    });
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end().catch(() => undefined);
    pool = null;
    db = null;
  }
  probeState = null;
}

/**
 * Prüft einmalig, ob die Datenbank erreichbar ist (SELECT 1).
 * Wird von den Services genutzt, um auf den In-Memory-Fallback zu wechseln.
 */
export async function isDbAvailable(): Promise<boolean> {
  if (probeState !== null) return probeState;
  const client = getDb();
  if (!client) {
    probeState = false;
    return false;
  }
  try {
    await client.execute(sql`select 1`);
    probeState = true;
  } catch (err) {
    console.warn(
      `[db] Postgres nicht erreichbar – In-Memory-Fallback aktiv. (${String((err as Error)?.message ?? err).slice(0, 120)})`,
    );
    probeState = false;
  }
  return probeState;
}
