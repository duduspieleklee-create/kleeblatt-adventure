-- Migration 0006: SIWE nonce workflow
-- Server-generated, single-use, time-limited nonces to prevent replay attacks
-- in the Sign-In with Ethereum (wallet) flow.
--
-- These objects belong to migration 0005's SIWE section but were missing from
-- some deployed databases (the wallet login failed with
-- "Could not find the function public.generate_siwe_nonce"). This migration
-- recreates them idempotently so `db:migrate` makes any environment consistent.
-- See issue #126.

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

--> statement-breakpoint

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
