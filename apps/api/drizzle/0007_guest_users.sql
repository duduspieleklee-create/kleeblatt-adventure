-- Migration 0007: guest accounts (issue #125)
--
-- Adds a `guest` flag to the users table so a temporary, unauthenticated
-- player ("Play as guest") can be created and later upgraded in place into a
-- full email/password account without losing progress.
--
-- Robust against both deployment states:
--   * fresh / migrated-with-0005: table is `public`.`users`
--   * pre-0005 legacy: table was renamed to `public`.`users_old_backup`
-- The DO block only touches whichever table is present.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    ALTER TABLE "public"."users"
      ADD COLUMN IF NOT EXISTS "guest" boolean NOT NULL DEFAULT false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users_old_backup'
  ) THEN
    ALTER TABLE "public"."users_old_backup"
      ADD COLUMN IF NOT EXISTS "guest" boolean NOT NULL DEFAULT false;
  END IF;
END $$;
