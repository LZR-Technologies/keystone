-- 0001_initial_schema.sql
--
-- Foundation migration. It establishes every database convention this project
-- follows; later migrations copy these patterns. Applied by
-- scripts/db-migrate.sh, which tracks applied files in schema_migrations.
--
-- Conventions demonstrated here (each explained inline where used):
--   1. snake_case identifiers everywhere in the database
--   2. UUID primary keys via core gen_random_uuid() (PostgreSQL 13+, no extension)
--   3. tenant_id on every business table (tenant isolation)
--   4. created_at / updated_at timestamps, updated_at kept fresh by trigger
--   5. deleted_at soft delete (rows are marked, never destroyed)
--   6. ROW LEVEL SECURITY with a tenant-isolation policy
--
-- Ordering rule: MIGRATION BEFORE CODE. The schema change ships and is applied
-- to the target database BEFORE the code that depends on it deploys. Old code
-- must keep working against the new schema (additive changes first; destructive
-- changes only after no code references the old shape).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

-- No extension required for gen_random_uuid(): it has been a CORE function
-- (not pgcrypto-provided) since PostgreSQL 13. This project targets PG13+,
-- so the pgcrypto extension is intentionally omitted -- requiring it would
-- fail on managed/embedded Postgres builds that do not ship it.

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at honest
-- ---------------------------------------------------------------------------

-- One function reused by every table's trigger. Why a trigger instead of
-- trusting application code: every write path (app, psql session, future
-- background job) goes through the database, so the database is the only
-- place that can guarantee updated_at is always correct.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Worked example table: items
-- ---------------------------------------------------------------------------

-- Example entity (mirrors the app's worked examples in src/lib/events.ts and
-- src/lib/query-keys.ts). Replace/extend with real entities, keeping every
-- convention shown here.
--
-- Identifiers are snake_case: PostgreSQL folds unquoted identifiers to
-- lowercase, so camelCase would force quoting everywhere. TypeScript code
-- uses camelCase; the mapping happens once at the data-access layer.
CREATE TABLE IF NOT EXISTS items (
  -- UUID primary key: safe to generate anywhere (no central sequence),
  -- non-guessable in URLs, and merge-friendly across environments.
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant isolation: EVERY business table carries tenant_id. It is the anchor for
  -- row level security below -- a table without it cannot be isolated and
  -- must not hold tenant data.
  tenant_id uuid NOT NULL,

  name text NOT NULL,

  -- Audit timestamps: timestamptz (never naive timestamp) so instants stay
  -- unambiguous across time zones.
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Soft delete: rows are marked deleted, never physically removed, so
  -- history and audits survive and accidental deletions are recoverable.
  -- NULL = alive. Application queries must filter WHERE deleted_at IS NULL.
  deleted_at timestamptz
);

-- Partial index on the live rows of the tenant: every application query
-- filters by tenant_id and excludes soft-deleted rows, so this index matches
-- the real access pattern and stays smaller than a full index.
CREATE INDEX IF NOT EXISTS items_tenant_id_alive_idx
  ON items (tenant_id)
  WHERE deleted_at IS NULL;

-- Attach the shared updated_at trigger (convention 4).
DROP TRIGGER IF EXISTS items_set_updated_at ON items;
CREATE TRIGGER items_set_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security: tenant isolation
-- ---------------------------------------------------------------------------

-- RLS is the last line of defense: even if application code forgets a WHERE
-- clause, the database refuses to leak another tenant's rows.
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- FORCE applies the policy to the table owner too. Without it, connecting as
-- the owning role silently bypasses every policy -- a common footgun.
ALTER TABLE items FORCE ROW LEVEL SECURITY;

-- The application sets the current tenant per connection/transaction:
--   SET LOCAL app.tenant_id = '<uuid>';
-- (app.tenant_id is the same GUC name the api template's migration uses, so both
-- templates speak one convention and a shared auth/session layer sets one variable
-- name for either stack.)
-- current_setting(..., true) returns NULL instead of erroring when the
-- setting is absent, and NULL never equals tenant_id -- so an unconfigured
-- connection sees ZERO rows (fail closed, never fail open).
--
-- nullif(..., '') guards the OTHER empty case: a session that explicitly set
-- app.tenant_id to '' (rather than leaving it unset) would otherwise hit a
-- hard cast error ('' is not a valid uuid) instead of the same fail-closed
-- "zero rows" behavior. nullif turns '' into NULL first, so both "unset" and
-- "set to empty" collapse to the same safe, silent, zero-row outcome.
--
-- If this project adopts an auth provider that stores the tenant in a JWT
-- claim, replace the expression accordingly (e.g. a claim-reading function);
-- the policy shape stays the same.
DROP POLICY IF EXISTS items_tenant_isolation ON items;
CREATE POLICY items_tenant_isolation ON items
  -- USING gates reads/updates/deletes; WITH CHECK gates inserts and the new
  -- version of updated rows. Both are required: USING alone would still let
  -- an insert plant a row into another tenant.
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
