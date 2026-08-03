/** Vitest-Setup (apps/api): hermetiche Unit-Tests erzwingen den In-Memory-Pfad,
 *  auch wenn in CI eine DATABASE_URL gesetzt ist (dort läuft Postgres ohne Migrationen). */

process.env.DATABASE_URL = "";
process.env.NODE_ENV = "test";
