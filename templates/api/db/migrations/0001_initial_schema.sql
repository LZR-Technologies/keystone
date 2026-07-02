-- 0001_initial_schema.sql
--
-- Foundation migration: the shared updated_at trigger function and one
-- example table ("items") that embodies every database convention of this
-- template. New tables copy this shape.
--
-- Convention: ALL database identifiers (tables, columns, functions, indexes,
-- policies) are snake_case. Postgres folds unquoted identifiers to lowercase,
-- so camelCase would force quoting every identifier in every query forever.
-- Application code stays camelCase; the repository layer owns the mapping.
--
-- Requires Postgres 13+: gen_random_uuid() (used below) is core as of 13, so
-- no "create extension pgcrypto" is needed here.

-- Shared trigger function: keeps updated_at honest on every UPDATE.
-- Why a trigger and not application code: every write path (app, psql,
-- another service) gets the same behavior; nobody can forget to set it.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Example table. Replace "items" with your first real domain table, keeping
-- every column and comment below.
create table if not exists items (
  -- uuid over serial: primary keys are exposed in URLs and logs, and a uuid
  -- is unguessable — sequential ids leak volume and invite enumeration.
  id uuid primary key default gen_random_uuid(),

  -- Tenant isolation: every row belongs to exactly one tenant. NOT NULL is the
  -- point — a row with no owner is a data leak waiting to happen.
  tenant_id uuid not null,

  name text not null,

  -- timestamptz, never timestamp: the server, the client, and the host may
  -- sit in different time zones; timestamptz stores an absolute instant.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Soft delete: "delete" means hide, not destroy. Rows are recoverable and
  -- auditable; every read query must filter "deleted_at is null".
  deleted_at timestamptz
);

-- Auto-maintain updated_at (see set_updated_at above).
drop trigger if exists items_set_updated_at on items;
create trigger items_set_updated_at
  before update on items
  for each row
  execute function set_updated_at();

-- Every query filters by tenant, so tenant_id is the access path. The partial
-- index (deleted_at is null) matches the soft-delete filter that all live
-- reads carry, keeping the index small and always usable.
create index if not exists items_tenant_id_idx
  on items (tenant_id)
  where deleted_at is null;

-- Row Level Security: tenant isolation enforced by the DATABASE, not by
-- remembering a WHERE clause in application code.
alter table items enable row level security;

-- force: even the table owner goes through policies. Without this, an app
-- connecting as the owner role would silently bypass RLS.
alter table items force row level security;

-- Tenant isolation policy. The application sets the tenant per connection:
--   set_config('app.tenant_id', '<uuid>', true)
-- current_setting(..., true) returns NULL when the setting is absent, and a
-- NULL comparison makes the policy match ZERO rows — a session with no
-- tenant is blocked, it never "sees everything". That failure direction is
-- deliberate: forgetting the tenant must fail closed, not open.
--
-- nullif(..., '') guards the OTHER empty case: a session that explicitly set
-- app.tenant_id to '' (rather than leaving it unset) would otherwise hit a
-- hard cast error ('' does not become a valid uuid) instead of the same
-- fail-closed "zero rows" behavior. nullif turns '' into NULL first, so both
-- "unset" and "set to empty" collapse to the same safe, silent, zero-row
-- outcome — fail closed without an exception leaking policy internals.
-- (On a managed auth platform, swap the right-hand side for the platform's
-- JWT claim accessor; the policy shape stays the same.)
drop policy if exists items_tenant_isolation on items;
create policy items_tenant_isolation on items
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
