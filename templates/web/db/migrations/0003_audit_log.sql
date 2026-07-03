-- 0003_audit_log.sql
--
-- Optional multi-tenant capability: an append-only AUDIT LOG (a ledger). Every
-- INSERT/UPDATE/DELETE on a business table is recorded as an immutable row here,
-- so the product can answer "who changed what, when" long after the change --
-- for compliance, incident review, or simple support.
--
-- Design decisions (each explained inline where used):
--   1. APPEND-ONLY is enforced by the database, not by convention. A trigger
--      rejects UPDATE/DELETE on the log itself -- even from a role that holds the
--      grant -- so the ledger cannot be quietly rewritten (an audit log that can
--      be edited is not an audit log).
--   2. The writer trigger is SECURITY DEFINER: it runs as the migration's owner,
--      so the application role needs NO direct INSERT grant on audit_log. This
--      keeps the log tamper-resistant from the app's side -- the app cannot
--      write to it directly, only cause writes through the audited table.
--   3. The log is written by an AFTER trigger on the audited table, so a row is
--      logged only once the change has actually committed to that table -- never
--      logging a change that a later constraint would have rolled back.

-- ---------------------------------------------------------------------------
-- The ledger table
-- ---------------------------------------------------------------------------

-- One row per change. Deliberately NOT a business table in the 0001 sense: it has
-- no updated_at (rows never change), no deleted_at (rows are never removed), and
-- no RLS tenant policy of its own -- reads are an administrative concern, and the
-- immutability trigger below is what actually protects it.
CREATE TABLE IF NOT EXISTS audit_log (
  -- Same UUID PK convention as every other table (0001): safe to generate
  -- anywhere, non-guessable, merge-friendly.
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The tenant the changed row belonged to. Nullable because a future audited
  -- table might be tenant-less; for `items` it is always present. Kept as a plain
  -- column (no FK) so purging or archiving a tenant never orphans or blocks the
  -- historical record.
  tenant_id uuid,

  -- Who caused the change, as the application knows them (an email, a user id, a
  -- system actor). Read from a per-session GUC (app.actor) the same way tenant is
  -- read -- text, because the log must survive even if the underlying user record
  -- is later deleted. NULL when the session did not identify an actor.
  actor text,

  -- What happened: 'insert' | 'update' | 'delete' (lowercased TG_OP, see below).
  action text NOT NULL,

  -- Which table the change was on ('items' today). Recorded so one ledger can
  -- cover many audited tables without a separate log per table.
  entity text NOT NULL,

  -- The primary key of the changed row. Nullable to stay generic, though every
  -- row this template logs carries one.
  entity_id uuid,

  -- When it happened. timestamptz (never naive timestamp) so the instant is
  -- unambiguous across time zones, matching the 0001 convention.
  occurred_at timestamptz NOT NULL DEFAULT now(),

  -- The full changed row as JSON (the NEW image for insert/update, the OLD image
  -- for delete). jsonb (not json) so it is stored parsed and can be queried/
  -- indexed later; captures the whole row so the log is self-contained even if the
  -- table's shape changes in a later migration.
  data jsonb
);

-- Reads are typically "the history of one entity" or "everything in a tenant";
-- both filter and sort by time, so index the common access pattern.
CREATE INDEX IF NOT EXISTS audit_log_tenant_occurred_idx
  ON audit_log (tenant_id, occurred_at);

-- ---------------------------------------------------------------------------
-- Writer: record every change to items
-- ---------------------------------------------------------------------------

-- Runs AFTER each row change on items and appends one ledger row describing it.
--
-- SECURITY DEFINER: the function executes with the privileges of its owner (the
-- migration's role), NOT the calling application role. That is why the app needs
-- no INSERT grant on audit_log -- it cannot write the log directly, only trigger
-- this function by changing an audited row. `SET search_path = pg_catalog, public`
-- pins name resolution so a caller cannot shadow `audit_log` with an object on
-- their own search_path and redirect the write -- the standard hardening for any
-- SECURITY DEFINER function.
--
-- coalesce(NEW, OLD): NEW is the row for INSERT/UPDATE, OLD for DELETE (the other
-- is NULL). One expression covers all three operations so there is no per-op
-- branch to drift out of sync.
CREATE OR REPLACE FUNCTION audit_items()
RETURNS trigger
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  -- The affected row: NEW for INSERT/UPDATE, OLD for DELETE (the other is NULL).
  -- Captured into a single record variable because PostgreSQL's parser does not
  -- allow field access directly on a function result (coalesce(NEW, OLD).id is a
  -- syntax error) -- assigning to a variable first makes the field access legal,
  -- and keeps ONE expression covering all three operations with no per-op branch.
  affected record := coalesce(NEW, OLD);
BEGIN
  INSERT INTO audit_log (tenant_id, actor, action, entity, entity_id, data)
  VALUES (
    affected.tenant_id,
    -- Actor comes from a per-session GUC set by the app (SET LOCAL app.actor).
    -- nullif(..., '') collapses "unset" and "set to empty" to the same NULL, so an
    -- anonymous/system change is recorded as NULL rather than an empty string.
    nullif(current_setting('app.actor', true), ''),
    -- TG_OP is 'INSERT'|'UPDATE'|'DELETE' (upper); lower() to match the column's
    -- documented lowercase domain.
    lower(TG_OP),
    'items',
    affected.id,
    -- to_jsonb of the whole row: the complete before/after image in one column.
    to_jsonb(affected)
  );
  -- AFTER-trigger return value is ignored, but returning the row is the
  -- conventional, harmless choice.
  RETURN affected;
END;
$$ LANGUAGE plpgsql;

-- One trigger covering all three operations (AFTER, so only committed changes are
-- logged). FOR EACH ROW: one ledger entry per changed row, not per statement.
DROP TRIGGER IF EXISTS items_audit ON items;
CREATE TRIGGER items_audit
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION audit_items();

-- ---------------------------------------------------------------------------
-- Immutability: reject any change to the ledger
-- ---------------------------------------------------------------------------

-- Any attempt to UPDATE or DELETE an audit_log row raises an error and aborts the
-- statement. This is what makes the log append-only IN THE DATABASE: even a role
-- that somehow holds UPDATE/DELETE on audit_log (or the owner) is stopped here.
-- INSERT is intentionally NOT covered -- appending is the only allowed write.
CREATE OR REPLACE FUNCTION audit_log_reject_change()
RETURNS trigger AS $$
BEGIN
  -- The message names the blocked operation so a caller sees exactly what was
  -- rejected and why, not a generic failure.
  RAISE EXCEPTION 'audit_log is append-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

-- BEFORE UPDATE OR DELETE: fire before the change is attempted so it never
-- happens. FOR EACH ROW so the exception names the operation on the specific row.
DROP TRIGGER IF EXISTS audit_log_immutable ON audit_log;
CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_reject_change();
