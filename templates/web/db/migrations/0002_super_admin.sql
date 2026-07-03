-- 0002_super_admin.sql
--
-- Optional multi-tenant capability: a cross-tenant SUPER-ADMIN. The base
-- migration (0001) isolates every session to a single tenant; some products
-- also need a support/administration session that can see and touch EVERY
-- tenant's rows. This migration adds that escape hatch WITHOUT weakening the
-- default: a normal session stays locked to its own tenant exactly as before.
--
-- Design decisions (each explained inline where used):
--   1. Super-admin is a per-session flag (a GUC), not a table/column. It is the
--      same session-variable mechanism the tenant already uses (app.tenant_id),
--      so a single auth/session layer sets both -- no new join, no new lookup on
--      the read path, and the policy stays a pure expression.
--   2. FAIL CLOSED: is_super_admin() defaults to false. A session that never set
--      the flag is an ordinary tenant session, isolated as in 0001. Elevation is
--      opt-in and explicit, never the accidental default.
--   3. The policy is REDEFINED (drop + recreate) rather than added as a second
--      policy. Two permissive policies OR together, which would work here, but a
--      single policy keeps the whole access rule readable in one place -- the
--      reviewer sees the complete condition, not a rule assembled from fragments.

-- ---------------------------------------------------------------------------
-- Super-admin predicate
-- ---------------------------------------------------------------------------

-- is_super_admin() reads a per-session flag and answers "may this session cross
-- tenant boundaries?". The application elevates a session with:
--   SET LOCAL app.is_super_admin = 'true';
-- and leaves it unset for every normal request.
--
-- current_setting(..., true) returns NULL (instead of erroring) when the flag was
-- never set; COALESCE(..., false) turns that NULL into false -- the fail-closed
-- default. Only the exact string 'true' elevates; anything else (unset, '',
-- 'false', garbage) is treated as not-super-admin.
--
-- STABLE: the result does not change within a single statement (the GUC is fixed
-- for the duration), so the planner may cache it per statement instead of
-- re-evaluating per row. Not IMMUTABLE -- the value depends on session state, not
-- only on its (absent) arguments.
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE(current_setting('app.is_super_admin', true) = 'true', false);
$$ LANGUAGE sql STABLE;

-- ---------------------------------------------------------------------------
-- Redefine the items policy to honor super-admin
-- ---------------------------------------------------------------------------

-- Replace the tenant-isolation policy from 0001 with one that additionally lets a
-- super-admin session through. The tenant branch is byte-for-byte the isolation
-- rule from 0001 (same nullif/current_setting/cast, same fail-closed behavior),
-- so a NON-super-admin session behaves EXACTLY as it did before this migration:
-- is_super_admin() returns false, the OR collapses to the tenant check alone, and
-- cross-tenant reads/writes stay blocked.
--
-- A super-admin session (app.is_super_admin = 'true') makes is_super_admin()
-- return true, so the OR is satisfied for every row regardless of tenant_id --
-- full cross-tenant visibility and write access, which is the whole point.
--
-- Both USING and WITH CHECK get the same expression: USING gates reads/updates/
-- deletes, WITH CHECK gates inserts and the post-update row. A super-admin must be
-- able to WRITE across tenants too (e.g. fix a support ticket's row), so the
-- super-admin branch belongs in WITH CHECK as well, not only USING.
DROP POLICY IF EXISTS items_tenant_isolation ON items;
CREATE POLICY items_tenant_isolation ON items
  USING (
    tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    OR is_super_admin()
  )
  WITH CHECK (
    tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    OR is_super_admin()
  );
