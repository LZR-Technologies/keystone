-- 0002_super_admin.sql
--
-- Optional multi-tenant feature: a cross-tenant super-admin. Layers ON TOP of
-- the tenant isolation from 0001 — it does not replace it. A support/admin
-- session that opts in (by setting app.is_super_admin) sees and writes across
-- every tenant; every other session stays bound to its own tenant exactly as
-- before. Keystone drops this migration when the project did not ask for a
-- super-admin, so the shipped template must be safe to include OR omit.
--
-- Convention (same as 0001): all identifiers snake_case; application code stays
-- camelCase and the repository layer owns the mapping.

-- Reads the "am I super-admin?" flag off the current session. Split out as a
-- function (not inlined into the policy) so the intent reads once and the two
-- policy clauses below share the exact same test — no chance of USING and
-- WITH CHECK drifting apart.
--
-- stable: within one statement the setting does not change, so Postgres may
-- cache the result — cheaper than re-reading current_setting per row.
--
-- Decision: default to false (fail-closed). current_setting('app.is_super_admin',
-- true) returns NULL when the setting was never set — the overwhelmingly common
-- case of an ordinary tenant session. coalesce(..., false) turns that NULL into
-- false, so a session is super-admin ONLY when it explicitly set the flag to the
-- literal 'true'. Any other value ('false', '1', '', garbage) is not super-admin.
-- Forgetting to set it must never accidentally grant cross-tenant access.
create or replace function is_super_admin()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('app.is_super_admin', true) = 'true', false)
$$;

-- Re-create the tenant isolation policy from 0001, now widened by "OR
-- is_super_admin()". Decision: replace the policy rather than add a second one.
-- Postgres combines multiple permissive policies with OR anyway, so a separate
-- super-admin policy would produce the same logic — but two policies for one
-- table split the rule across migrations and make the effective access harder
-- to read. One policy that states the whole truth (own tenant OR super-admin)
-- is the honest, auditable form. The tenant clause is byte-for-byte the one in
-- 0001 (same nullif/fail-closed reasoning); only the "or is_super_admin()"
-- disjunct is new.
drop policy if exists items_tenant_isolation on items;
create policy items_tenant_isolation on items
  using (
    tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    or is_super_admin()
  )
  with check (
    tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    or is_super_admin()
  );
