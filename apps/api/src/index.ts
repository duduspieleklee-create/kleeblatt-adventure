import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { runMigrationsIfAvailable } from "./db/migrate.js";
import { isDbAvailable } from "./db/client.js";

const app = createApp();

// Migrationen anwenden, falls Postgres erreichbar (Prototyp: sonst In-Memory).
await runMigrationsIfAvailable();

// Auth-Startup-Summary (keine Secrets) – hilft bei Produktions-Diagnose.
console.info(
  `[auth] googleConfigured=${Boolean(env.googleClientId && env.googleClientSecret)} ` +
    `callbackUrl=${env.googleCallbackUrl} webUrl=${env.webUrl} cookieSecure=${env.nodeEnv === "production"} db=${(await isDbAvailable()) ? "postgres" : "memory"}`,
);

console.info(`API listening on http://localhost:${env.port}`);
serve({ fetch: app.fetch, port: env.port });
