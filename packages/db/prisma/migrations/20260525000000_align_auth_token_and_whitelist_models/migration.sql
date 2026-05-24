-- Align migration history with current Prisma schema for auth tokens and whitelist.

-- New whitelist table used by current schema.
CREATE TABLE IF NOT EXISTS "whitelisted_phones" (
  "phone" VARCHAR(20) NOT NULL,
  "company" VARCHAR(64),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "whitelisted_phones_pkey" PRIMARY KEY ("phone")
);

-- Backfill from legacy whitelist table if it exists.
DO $$
BEGIN
  IF to_regclass('public.phone_whitelist') IS NOT NULL THEN
    INSERT INTO "whitelisted_phones" ("phone", "created_at")
    SELECT pw."phone", COALESCE(pw."created_at", CURRENT_TIMESTAMP)
    FROM "phone_whitelist" pw
    ON CONFLICT ("phone") DO NOTHING;
  END IF;
END $$;

-- Add refresh token support to auth tokens (safe for existing data).
ALTER TABLE "auth_tokens"
  ADD COLUMN IF NOT EXISTS "refresh_token" VARCHAR(255);

UPDATE "auth_tokens"
SET "refresh_token" = 'legacy_' || md5("token" || ':' || EXTRACT(EPOCH FROM COALESCE("created_at", CURRENT_TIMESTAMP))::text)
WHERE "refresh_token" IS NULL;

ALTER TABLE "auth_tokens"
  ALTER COLUMN "refresh_token" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "auth_tokens_refresh_token_key"
  ON "auth_tokens"("refresh_token");
