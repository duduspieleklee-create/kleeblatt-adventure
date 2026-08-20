-- Email/password auth: add a (nullable) password hash and enforce unique emails.
-- Idempotent so re-running is safe. Applied on stage via `npm run db:migrate`.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
