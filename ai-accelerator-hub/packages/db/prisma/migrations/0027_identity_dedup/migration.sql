-- docs/IDENTITY_DEDUP_SPEC.md: one person, one account. Safe to run twice.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mergedIntoId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mergedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "user_emails" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailKey" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_emails_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_emails_email_key" ON "user_emails"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "user_emails_emailKey_key" ON "user_emails"("emailKey");
CREATE INDEX IF NOT EXISTS "user_emails_userId_idx" ON "user_emails"("userId");
DO $$ BEGIN
  ALTER TABLE "user_emails" ADD CONSTRAINT "user_emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill one primary row per user. The key matches identityCore.emailKey: lowercase, +tag removed,
-- gmail/googlemail dots removed. Users that share a key (the duplicates) conflict and get no row until merged;
-- the duplicate report finds them by name and email.
INSERT INTO "user_emails" ("id", "userId", "email", "emailKey", "isPrimary", "verified")
SELECT 'ue_' || md5(u."id"), u."id", lower(u."email"),
  CASE WHEN split_part(lower(u."email"), '@', 2) IN ('gmail.com', 'googlemail.com')
    THEN replace(split_part(split_part(lower(u."email"), '@', 1), '+', 1), '.', '') || '@gmail.com'
    ELSE split_part(split_part(lower(u."email"), '@', 1), '+', 1) || '@' || split_part(lower(u."email"), '@', 2) END,
  true, u."emailVerified"
FROM "users" u
ORDER BY u."createdAt" ASC
ON CONFLICT DO NOTHING;

-- docs/IDENTITY_DEDUP_SPEC.md §3.12: tickets for duplicate groups that need a Super Admin.
CREATE TABLE IF NOT EXISTS "duplicate_tickets" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "requestedById" TEXT,
  "accountIds" TEXT NOT NULL,
  "accountKey" TEXT NOT NULL,
  "primaryId" TEXT,
  "reason" TEXT NOT NULL,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "duplicate_tickets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "duplicate_tickets_status_createdAt_idx" ON "duplicate_tickets"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "duplicate_tickets_accountKey_idx" ON "duplicate_tickets"("accountKey");
-- At most one open ticket per set of accounts, enforced by the database.
CREATE UNIQUE INDEX IF NOT EXISTS "duplicate_tickets_open_key" ON "duplicate_tickets"("accountKey") WHERE "status" = 'open';

-- docs/IDENTITY_DEDUP_SPEC.md §3.16: a secondary email is pending until its owner clicks the emailed link.
ALTER TABLE "user_emails" ADD COLUMN IF NOT EXISTS "pendingUntil" TIMESTAMP(3);
ALTER TABLE "user_emails" ADD COLUMN IF NOT EXISTS "verifyTokenHash" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "user_emails_verifyTokenHash_key" ON "user_emails"("verifyTokenHash");
