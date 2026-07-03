-- 0003_audit_log.sql
--
-- Optional multi-tenant feature: an append-only audit log (a ledger). Every
-- INSERT/UPDATE/DELETE on items is recorded automatically by a trigger, and the
-- log itself rejects any later change to a recorded row. Keystone drops this
-- migration when the project did not ask for it, so the shipped template must be
-- safe to include OR omit — it depends only on items (from 0001) and adds one
-- new table plus its triggers.
--
-- Convention (same as 0001): all identifiers snake_case.

-- The ledger. Deliberately denormalized and self-contained: it captures WHAT
-- happened as flat columns plus a full jsonb snapshot, so a recorded event stays
-- readable even after the source row is later deleted or the schema evolves.
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),

  -- Which tenant the change belonged to. Nullable on purpose: the log is written
  -- by a SECURITY DEFINER trigger (below) that runs regardless of RLS, and some
  -- future audited row might legitimately have no tenant — recording the event is
  -- more important than enforcing NOT NULL here.
  tenant_id uuid,

  -- Who caused the change, read from the app.actor session setting. Text, not a
  -- FK: the actor may be a user id, a service name, or a job — the log records
  -- the raw claim as it was at write time, it does not resolve or validate it.
  actor text,

  -- What happened: the SQL operation, lowercased ('insert' | 'update' | 'delete').
  action text not null,

  -- Which table the change was on. A column (not a separate table per entity) so
  -- one query reads the whole history across entities.
  entity text not null,

  -- The affected row's id. Nullable to stay robust if a future audited table ever
  -- lacks a simple id.
  entity_id uuid,

  -- When it happened. timestamptz, never timestamp — an absolute instant, same
  -- reasoning as 0001.
  occurred_at timestamptz not null default now(),

  -- Full snapshot of the row (NEW on insert/update, OLD on delete) as jsonb, so
  -- the exact recorded state survives even if the live row changes or is removed.
  data jsonb
);

-- Writes one audit_log row for the change that fired the trigger.
--
-- Decision: SECURITY DEFINER. The function runs as its OWNER (the migration/DB
-- owner), NOT as the app role that triggered it. That is what lets the app be
-- granted write access to items WITHOUT any direct insert grant on audit_log —
-- the app can never write the ledger by hand, only cause an entry through an
-- audited action. It also means the insert here is not filtered by the caller's
-- RLS scope, so the event is always recorded.
create or replace function audit_items()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into audit_log (tenant_id, actor, action, entity, entity_id, data)
  values (
    -- coalesce(new, old): on delete NEW is null, on insert OLD is null; this
    -- picks whichever tuple exists for the current operation.
    coalesce(new.tenant_id, old.tenant_id),
    -- nullif(..., '') so an unset OR empty app.actor both land as NULL rather
    -- than recording an empty string as if it were a real actor.
    nullif(current_setting('app.actor', true), ''),
    lower(tg_op),
    'items',
    coalesce(new.id, old.id),
    to_jsonb(coalesce(new, old))
  );
  -- after-trigger return value is ignored, but plpgsql still requires one; return
  -- the row so the function is valid for INSERT/UPDATE/DELETE alike.
  return coalesce(new, old);
end;
$$;

-- Record every write to items. after (not before): the row has its final,
-- defaulted values (generated id, updated_at) by the time we snapshot it.
drop trigger if exists items_audit on items;
create trigger items_audit
  after insert or update or delete on items
  for each row
  execute function audit_items();

-- Enforces append-only: raises on any attempt to change a recorded row.
-- Decision: NOT security definer. Ordinary (invoker) rights are enough — this
-- function only raises; it needs no elevated privilege, and keeping it minimal
-- avoids granting power it does not use.
create or replace function audit_log_reject_change()
returns trigger
language plpgsql
as $$
begin
  -- tg_op tells the caller which forbidden operation they attempted, so the
  -- error names the cause instead of a bare "not allowed".
  raise exception 'audit_log is append-only: % is not allowed', tg_op;
end;
$$;

-- Immutability guard. before update/delete so the change is rejected BEFORE it
-- touches the table. Decision: this blocks EVEN a caller with update/delete
-- privilege on audit_log — the append-only guarantee is enforced by the database,
-- not by withholding grants, so it holds even for the table owner.
drop trigger if exists audit_log_immutable on audit_log;
create trigger audit_log_immutable
  before update or delete on audit_log
  for each row
  execute function audit_log_reject_change();
