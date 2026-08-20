/** Vitest-Setup (apps/api): hermetiche Unit-Tests erzwingen den In-Memory-Pfad,
 *  auch wenn in CI eine DATABASE_URL gesetzt ist (dort läuft Postgres ohne Migrationen).
 *  Zusätzlich Test-Credentials für die Google-OAuth-Routen. */

process.env.DATABASE_URL = "";
process.env.NODE_ENV = "test";
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.WEB_URL = "https://stage.kleeblatt.space";
process.env.GOOGLE_CALLBACK_URL = "https://stage.kleeblatt.space/auth/google/callback";
