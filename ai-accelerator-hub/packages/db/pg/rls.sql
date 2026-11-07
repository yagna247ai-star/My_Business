-- Postgres Row-Level Security for AI Accelerator Hub.
-- STATUS: REVIEWED, NOT APPLIED. There is no live Postgres in this environment
-- (dev runs SQLite; CI here has no docker), so these policies have NOT been
-- executed against a database. Apply + verify on staging Postgres 16 BEFORE
-- production. See README.md in this directory.
--
-- Contract with the app: every transaction that touches tenant data must run
--   SET LOCAL app.current_tenant = '<tenantId>';
-- and service jobs (migrations, seeds, analytics rollups) must run
--   SET LOCAL app.role = 'service';
-- The app already scopes every query by tenantId at the Prisma layer; RLS is
-- defense in depth so a missed scope can never leak across tenants.

-- Helper: current tenant, empty when unset (policies then match nothing).
-- Usage in policies: tenant_id = current_setting('app.current_tenant', true)
--   AND current_setting('app.role', true) IS DISTINCT FROM 'service'
-- We express the service bypass per policy for explicitness.

DO $$ BEGIN
  RAISE NOTICE 'Applying AI Accelerator Hub RLS policies (reviewed, staging-verify required)';
END $$;

-- Generic template applied per table below:
--   ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE <t> FORCE ROW LEVEL SECURITY;
--   CREATE POLICY <t>_tenant_isolation ON <t>
--     USING (tenant_id = current_setting('app.current_tenant', true)
--        OR current_setting('app.role', true) = 'service');

-- Tenants table itself: a tenant sees only its own row (or service).
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenants_isolation ON tenants;
CREATE POLICY tenants_isolation ON tenants
  USING (id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

-- Memberships: scoped by tenant; a signed-in user sees only their own row
-- (plus service). Requires app to also SET LOCAL app.current_user.
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memberships_isolation ON memberships;
CREATE POLICY memberships_isolation ON memberships
  USING ((tenant_id = current_setting('app.current_tenant', true)
          AND (user_id = current_setting('app.current_user', true)
               OR current_setting('app.role', true) = 'service'))
     OR current_setting('app.role', true) = 'service');

-- Core tenant-scoped tables: strict tenant match, service bypass only.
-- (One block per table so a failure applies narrowly and is easy to audit.)

ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cohorts_tenant_isolation ON cohorts;
CREATE POLICY cohorts_tenant_isolation ON cohorts
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS teams_tenant_isolation ON teams;
CREATE POLICY teams_tenant_isolation ON teams
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_memberships_tenant_isolation ON team_memberships;
CREATE POLICY team_memberships_tenant_isolation ON team_memberships
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS journeys_tenant_isolation ON journeys;
CREATE POLICY journeys_tenant_isolation ON journeys
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS levels_tenant_isolation ON levels;
CREATE POLICY levels_tenant_isolation ON levels
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS activities_tenant_isolation ON activities;
CREATE POLICY activities_tenant_isolation ON activities
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enrollments_tenant_isolation ON enrollments;
CREATE POLICY enrollments_tenant_isolation ON enrollments
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS progress_tenant_isolation ON progress;
CREATE POLICY progress_tenant_isolation ON progress
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS submissions_tenant_isolation ON submissions;
CREATE POLICY submissions_tenant_isolation ON submissions
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_ledger FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS xp_ledger_tenant_isolation ON xp_ledger;
CREATE POLICY xp_ledger_tenant_isolation ON xp_ledger
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS streaks_tenant_isolation ON streaks;
CREATE POLICY streaks_tenant_isolation ON streaks
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS posts_tenant_isolation ON posts;
CREATE POLICY posts_tenant_isolation ON posts
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comments_tenant_isolation ON comments;
CREATE POLICY comments_tenant_isolation ON comments
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reports_tenant_isolation ON reports;
CREATE POLICY reports_tenant_isolation ON reports
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS blocks_tenant_isolation ON blocks;
CREATE POLICY blocks_tenant_isolation ON blocks
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hackathons_tenant_isolation ON hackathons;
CREATE POLICY hackathons_tenant_isolation ON hackathons
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE hackathon_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_entries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hackathon_entries_tenant_isolation ON hackathon_entries;
-- Entries carry no tenant_id; they inherit the hackathon's tenant.
CREATE POLICY hackathon_entries_tenant_isolation ON hackathon_entries
  USING (EXISTS (SELECT 1 FROM hackathons h WHERE h.id = hackathon_entries.hackathon_id
                 AND (h.tenant_id = current_setting('app.current_tenant', true)
                      OR current_setting('app.role', true) = 'service')));

ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_reviews FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS peer_reviews_tenant_isolation ON peer_reviews;
-- Peer reviews inherit the entry's hackathon tenant.
CREATE POLICY peer_reviews_tenant_isolation ON peer_reviews
  USING (EXISTS (SELECT 1 FROM hackathon_entries e JOIN hackathons h ON h.id = e.hackathon_id
                 WHERE e.id = peer_reviews.entry_id
                 AND (h.tenant_id = current_setting('app.current_tenant', true)
                      OR current_setting('app.role', true) = 'service')));

ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE files FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS files_tenant_isolation ON files;
CREATE POLICY files_tenant_isolation ON files
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orders_tenant_isolation ON orders;
CREATE POLICY orders_tenant_isolation ON orders
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_tenant_isolation ON notifications;
CREATE POLICY notifications_tenant_isolation ON notifications
  USING (tenant_id = current_setting('app.current_tenant', true)
     OR current_setting('app.role', true) = 'service');
