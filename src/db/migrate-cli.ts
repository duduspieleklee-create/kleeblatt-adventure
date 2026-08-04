/** CLI-Runner für Migrationen: npm run db:migrate (API-Pfad: apps/api) */

import { runMigrationsIfAvailable } from "./migrate.js";
import { closeDb } from "./client.js";

const ok = await runMigrationsIfAvailable();
console.info(
  ok ? "[db] Migrationen angewendet." : "[db] Keine DB erreichbar – Migration übersprungen.",
);
await closeDb();
process.exit(ok ? 0 : 1);
