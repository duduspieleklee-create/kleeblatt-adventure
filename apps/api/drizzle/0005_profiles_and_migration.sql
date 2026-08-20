-- ============================================================
-- Migration 0005: profiles table, RLS, triggers, user migration,
-- FK text→uuid conversion, and SIWE nonce workflow.
--
-- RESILIENT: Works for both fresh Supabase (no existing tables)
-- and existing deployments (migrating from old users table).
-- ============================================================

-- ============================================================
-- SECTION 1: profiles table
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."profiles" (
  "id" uuid PRIMARY KEY REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "username" text,
  "wallet_address" text UNIQUE,
  "level" integer NOT NULL DEFAULT 1,
  "gold" integer NOT NULL DEFAULT 100,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "profiles_wallet_address_idx"
  ON "public"."profiles" ("wallet_address")
  WHERE "wallet_address" IS NOT NULL;

--> statement-breakpoint

-- ============================================================
-- SECTION 2: Row Level Security
-- ============================================================

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "profiles_select_own" ON "public"."profiles"
    FOR SELECT TO authenticated USING ("id" = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_update_own" ON "public"."profiles"
    FOR UPDATE TO authenticated
    USING ("id" = auth.uid()) WITH CHECK ("id" = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_insert_own" ON "public"."profiles"
    FOR INSERT TO authenticated WITH CHECK ("id" = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

--> statement-breakpoint

-- ============================================================
-- SECTION 3: handle_new_user trigger
-- Auto-create a profiles row when a new auth.users row is inserted.
-- For Web3-native logins, extract wallet address from raw_user_meta_data.
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO "public"."profiles" ("id", "username", "wallet_address")
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'preferred_username',
      CASE WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1) ELSE NULL END
    ),
    CASE
      WHEN NEW.raw_user_meta_data->>'address' IS NOT NULL
        THEN NEW.raw_user_meta_data->>'address'
      WHEN NEW.raw_user_meta_data->>'wallet_address' IS NOT NULL
        THEN NEW.raw_user_meta_data->>'wallet_address'
      ELSE NULL
    END
  )
  ON CONFLICT ("id") DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
CREATE TRIGGER "on_auth_user_created"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

--> statement-breakpoint

-- ============================================================
-- SECTION 4: Data migration — old users table → auth.users
-- SKIPPED if the old "users" table doesn't exist (fresh Supabase).
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."_user_id_map" (
  "old_id" text PRIMARY KEY,
  "new_id" uuid NOT NULL,
  "email" text NOT NULL
);

-- Only run data migration if the old "users" table exists and has rows
DO $$
DECLARE
  users_table_exists boolean;
  user_count integer;
  u RECORD;
  new_uuid uuid;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO users_table_exists;

  IF NOT users_table_exists THEN
    RAISE NOTICE 'Fresh Supabase — no old "users" table, skipping data migration';
    RETURN;
  END IF;

  EXECUTE 'SELECT count(*) FROM "public"."users"' INTO user_count;
  IF user_count = 0 THEN
    RAISE NOTICE 'Old "users" table is empty, skipping data migration';
    RETURN;
  END IF;

  RAISE NOTICE 'Migrating % users from old table to auth.users', user_count;

  FOR u IN SELECT * FROM "public"."users" LOOP
    new_uuid := gen_random_uuid();

    INSERT INTO "auth"."users" (
      "id", "instance_id", "aud", "role", "email",
      "encrypted_password", "email_confirmed_at",
      "raw_app_meta_data", "raw_user_meta_data",
      "created_at", "updated_at",
      "confirmation_token", "email_change", "email_change_token_new",
      "recovery_token", "action_link",
      "totp_secret", "totp_enrolled", "is_sso_user",
      "deleted_at", "banned_until"
    )
    SELECT
      new_uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', u.email,
      CASE WHEN u.password_hash IS NOT NULL THEN '' ELSE NULL END,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'display_name', u.display_name,
        'picture', u.picture,
        'old_user_id', u.id,
        'migrated_password_hash', u.password_hash
      ),
      u.created_at, now(),
      '', '', '', '', '',
      NULL, false, false, NULL, NULL
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "public"."_user_id_map" ("old_id", "new_id", "email")
    VALUES (u.id, new_uuid, u.email)
    ON CONFLICT ("old_id") DO NOTHING;
  END LOOP;
END $$;

--> statement-breakpoint

-- Create profiles rows from old users + heroes data (only if data was migrated)
DO $$
DECLARE
  map_count integer;
BEGIN
  SELECT count(*) INTO map_count FROM "public"."_user_id_map";
  IF map_count = 0 THEN
    RAISE NOTICE 'No migrated users, skipping profiles backfill';
    RETURN;
  END IF;

  EXECUTE $SQL$
    INSERT INTO "public"."profiles" ("id", "username", "level", "gold", "created_at")
    SELECT
      m.new_id,
      COALESCE(u.display_name, split_part(u.email, '@', 1)),
      COALESCE(h.level, 1),
      100,
      u.created_at
    FROM "public"."_user_id_map" m
    JOIN "public"."users" u ON u.id = m.old_id
    LEFT JOIN "public"."heroes" h ON h.user_id = m.old_id
    ON CONFLICT ("id") DO NOTHING
  $SQL$;
END $$;

--> statement-breakpoint

-- ============================================================
-- SECTION 5: FK migration — text → uuid for all user_id columns
-- Only runs if the old tables exist with text user_id columns.
-- ============================================================

DO $$
DECLARE
  users_table_exists boolean;
  col_type text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO users_table_exists;

  IF NOT users_table_exists THEN
    RAISE NOTICE 'Fresh Supabase — no old tables to convert, skipping FK migration';
    RETURN;
  END IF;

  -- heroes
  BEGIN
    ALTER TABLE "public"."heroes" DROP CONSTRAINT IF EXISTS "heroes_user_id_users_id_fk";
  EXCEPTION WHEN OTHERS THEN null; END;

  SELECT data_type INTO col_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='heroes' AND column_name='user_id';

  IF col_type = 'text' THEN
    ALTER TABLE "public"."heroes" ALTER COLUMN "user_id" TYPE uuid USING (
      SELECT "new_id" FROM "public"."_user_id_map" WHERE "old_id" = "heroes"."user_id"
    );
  END IF;

  BEGIN
    ALTER TABLE "public"."heroes"
      ADD CONSTRAINT "heroes_user_id_auth_users_fk"
      FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_table THEN null; END;

  -- items
  BEGIN
    ALTER TABLE "public"."items" DROP CONSTRAINT IF EXISTS "items_user_id_users_id_fk";
  EXCEPTION WHEN OTHERS THEN null; END;

  SELECT data_type INTO col_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='items' AND column_name='user_id';

  IF col_type = 'text' THEN
    ALTER TABLE "public"."items" ALTER COLUMN "user_id" TYPE uuid USING (
      SELECT "new_id" FROM "public"."_user_id_map" WHERE "old_id" = "items"."user_id"
    );
  END IF;

  BEGIN
    ALTER TABLE "public"."items"
      ADD CONSTRAINT "items_user_id_auth_users_fk"
      FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_table THEN null; END;

  -- wallets
  BEGIN
    ALTER TABLE "public"."wallets" DROP CONSTRAINT IF EXISTS "wallets_user_id_users_id_fk";
  EXCEPTION WHEN OTHERS THEN null; END;

  SELECT data_type INTO col_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='wallets' AND column_name='user_id';

  IF col_type = 'text' THEN
    ALTER TABLE "public"."wallets" ALTER COLUMN "user_id" TYPE uuid USING (
      SELECT "new_id" FROM "public"."_user_id_map" WHERE "old_id" = "wallets"."user_id"
    );
  END IF;

  BEGIN
    ALTER TABLE "public"."wallets"
      ADD CONSTRAINT "wallets_user_id_auth_users_fk"
      FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_table THEN null; END;

  -- chest_opens
  BEGIN
    ALTER TABLE "public"."chest_opens" DROP CONSTRAINT IF EXISTS "chest_opens_user_id_users_id_fk";
  EXCEPTION WHEN OTHERS THEN null; END;

  SELECT data_type INTO col_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='chest_opens' AND column_name='user_id';

  IF col_type = 'text' THEN
    ALTER TABLE "public"."chest_opens" ALTER COLUMN "user_id" TYPE uuid USING (
      SELECT "new_id" FROM "public"."_user_id_map" WHERE "old_id" = "chest_opens"."user_id"
    );
  END IF;

  BEGIN
    ALTER TABLE "public"."chest_opens"
      ADD CONSTRAINT "chest_opens_user_id_auth_users_fk"
      FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_table THEN null; END;

  -- inventory_stacks
  BEGIN
    ALTER TABLE "public"."inventory_stacks" DROP CONSTRAINT IF EXISTS "inventory_stacks_user_id_users_id_fk";
  EXCEPTION WHEN OTHERS THEN null; END;

  SELECT data_type INTO col_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inventory_stacks' AND column_name='user_id';

  IF col_type = 'text' THEN
    ALTER TABLE "public"."inventory_stacks" ALTER COLUMN "user_id" TYPE uuid USING (
      SELECT "new_id" FROM "public"."_user_id_map" WHERE "old_id" = "inventory_stacks"."user_id"
    );
  END IF;

  BEGIN
    ALTER TABLE "public"."inventory_stacks"
      ADD CONSTRAINT "inventory_stacks_user_id_auth_users_fk"
      FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_table THEN null; END;

  -- user_onboarding
  BEGIN
    ALTER TABLE "public"."user_onboarding" DROP CONSTRAINT IF EXISTS "user_onboarding_user_id_users_id_fk";
  EXCEPTION WHEN OTHERS THEN null; END;

  SELECT data_type INTO col_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_onboarding' AND column_name='user_id';

  IF col_type = 'text' THEN
    ALTER TABLE "public"."user_onboarding" ALTER COLUMN "user_id" TYPE uuid USING (
      SELECT "new_id" FROM "public"."_user_id_map" WHERE "old_id" = "user_onboarding"."user_id"
    );
  END IF;

  BEGIN
    ALTER TABLE "public"."user_onboarding"
      ADD CONSTRAINT "user_onboarding_user_id_auth_users_fk"
      FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_table THEN null; END;

  -- Backup the old users table
  BEGIN
    ALTER TABLE "public"."users" RENAME TO "users_old_backup";
  EXCEPTION WHEN duplicate_table THEN
    RAISE NOTICE 'users_old_backup already exists';
  END;

END $$;

--> statement-breakpoint

-- ============================================================
-- SECTION 6: SIWE nonce workflow
-- Server-generated, single-use, time-limited nonces to prevent
-- replay attacks in the Sign-In with Ethereum flow.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "public"."siwe_nonces" (
  "nonce" text PRIMARY KEY,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  "used" boolean NOT NULL DEFAULT false,
  "used_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "siwe_nonces_expires_idx"
  ON "public"."siwe_nonces" ("expires_at");

CREATE OR REPLACE FUNCTION "public"."generate_siwe_nonce"()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  new_nonce text;
BEGIN
  new_nonce := encode(gen_random_bytes(32), 'hex');
  INSERT INTO "public"."siwe_nonces" ("nonce") VALUES (new_nonce);
  DELETE FROM "public"."siwe_nonces"
  WHERE "expires_at" < now()
     OR ("used" = true AND "used_at" < now() - interval '1 hour');
  RETURN new_nonce;
END;
$$;

GRANT EXECUTE ON FUNCTION "public"."generate_siwe_nonce"() TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."siwe_nonces" TO anon, authenticated;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION "public"."verify_siwe_nonce"(
  input_nonce text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  rec RECORD;
BEGIN
  SELECT * INTO rec FROM "public"."siwe_nonces"
  WHERE "nonce" = input_nonce
  FOR UPDATE;

  IF NOT FOUND THEN RETURN false; END IF;
  IF rec.used THEN RETURN false; END IF;
  IF rec.expires_at < now() THEN RETURN false; END IF;

  UPDATE "public"."siwe_nonces"
  SET "used" = true, "used_at" = now()
  WHERE "nonce" = input_nonce;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION "public"."verify_siwe_nonce"(text) TO authenticated;
