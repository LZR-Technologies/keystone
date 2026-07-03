/**
 * Shared integration-test harness: one real Postgres (PGlite) with the FULL
 * migrated schema, plus the session helpers every integration test uses.
 *
 * Why this exists as a shared module. Three integration tests
 * (tenant-isolation, super-admin, audit-log) each need the same thing: a real
 * Postgres with EVERY migration applied in order, a non-owner role to prove
 * policies against, and a handful of "set the session variable" helpers. Before
 * this harness, tenant-isolation.test.ts applied only 0001 by hand. That made
 * its schema a subset of what ships — the super-admin policy (0002) and the
 * audit triggers (0003) were absent, so the test could pass while silently
 * diverging from the real, fully-migrated database. Applying ALL of
 * db/migrations/*.sql here closes that gap: the tests run against the exact
 * schema Keystone ships, super-admin and audit log included.
 *
 * The underscore prefix keeps this file from being picked up as a test file
 * (vitest's include is *.test.ts); it is a helper, imported by the tests.
 *
 * Coverage note: coverage measures src/** only (see vitest.config.ts). This
 * file lives under tests/, so it is neither measured nor able to affect the
 * 100% threshold — it is test infrastructure, not product code.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PGlite } from '@electric-sql/pglite'
import type { Client } from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, '..', '..', 'db', 'migrations')

// Non-owner role the policies are proven against. RLS (even with FORCE) is
// bypassed for the table owner / connecting superuser, so asserting anything
// about a policy requires a session running as a role that only holds the
// grants below — otherwise every assertion would "pass" for the wrong reason.
export const APP_ROLE = 'app_user'

/**
 * Minimal shape both drivers (PGlite and pg's Client) satisfy for the calls the
 * integration tests need. Lets each test's assertions run unchanged against
 * either backend instead of being duplicated per-driver.
 */
export interface QueryableConnection {
  query(sql: string, params?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>
}

/**
 * Every migration's SQL, in strict filename order — the same order
 * scripts/db-migrate.sh applies them in production. Reading them synchronously
 * keeps the async test setup simple; the set is tiny.
 *
 * Decision: readdir + explicit sort using only the Node standard library, no
 * glob dependency. The NNNN_ prefix defines execution order (0001 before 0002
 * before 0003) and a later migration may depend on an earlier one, so the
 * ordering is a correctness requirement — localeCompare on the zero-padded
 * names yields exactly that numeric order. Only *.sql is taken so the folder's
 * README.md is ignored.
 */
export function loadMigrationsInOrder(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => readFileSync(join(MIGRATIONS_DIR, name), 'utf8'))
}

/**
 * Apply the whole migration set, in order, to any connection. Shared so the
 * default PGlite path and the optional networked-Postgres path migrate
 * identically — divergence there would let one backend prove a different schema
 * than the other.
 */
export async function applyAllMigrations(exec: (sql: string) => Promise<unknown>): Promise<void> {
  for (const sql of loadMigrationsInOrder()) {
    await exec(sql)
  }
}

/**
 * Create the non-owner app role and grant it the same table privileges the
 * application connects with. Decision: grant on ALL tables in public, not just
 * items. With the audit log migration present there is a second table
 * (audit_log); the app must hold update/delete on it so the append-only test
 * proves the TRIGGER rejects the change — not a missing grant. (The app never
 * needs INSERT on audit_log by hand: the audit trigger writes it as SECURITY
 * DEFINER. The grant is harmless and keeps the role definition uniform.)
 */
export function grantAppRoleSql(role: string): string {
  return `
    drop role if exists ${role};
    create role ${role} nologin;
    grant select, insert, update, delete on all tables in schema public to ${role};
  `
}

/**
 * A fully-migrated in-process Postgres plus the session helpers the tests share.
 * `db` is exposed for setup/teardown (role switching, cleanup as owner); the
 * helpers wrap the session-variable calls so no test hand-writes set_config.
 */
export interface Harness {
  db: PGlite
  /**
   * Run a query against the harness connection, typed as QueryableConnection so
   * callers get `Array<Record<string, unknown>>` rows instead of PGlite's raw
   * result type. Every test reads through this rather than db.query directly, so
   * assertions share one row shape across both backends.
   */
  query(sql: string, params?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>
  /** RLS tenant scope for the current session (null clears it → fail-closed). */
  setTenant(tenantId: string | null): Promise<void>
  /** Opt the current session into cross-tenant super-admin (0002), or out of it. */
  setSuperAdmin(isSuperAdmin: boolean): Promise<void>
  /** The actor recorded by the audit trigger (0003) for writes in this session. */
  setActor(actor: string | null): Promise<void>
  /**
   * Reset to a clean per-test starting point: back to the owner role, wipe the
   * data tables, clear every session variable, then switch to the non-owner
   * role the test body runs as. Called from beforeEach.
   */
  reset(): Promise<void>
  close(): Promise<void>
}

/**
 * Set a session-scoped setting on a connection. Decision: session-scoped (the
 * `false` third arg), not transaction-local — both backends run each test as a
 * sequence of separate statements, not one open transaction, so a
 * transaction-scoped setting would not survive between them. Mirrors what the
 * application does per-request in production.
 */
async function setConfig(
  connection: QueryableConnection,
  key: string,
  value: string | null,
): Promise<void> {
  await connection.query('select set_config($1, $2, false)', [key, value ?? ''])
}

/**
 * Build the shared PGlite harness. `beforeAll`-friendly: constructs the
 * in-process database, applies every migration in order, and creates the app
 * role. The tests call the returned helpers; the module never holds global
 * state, so suites stay independent.
 */
export async function createHarness(): Promise<Harness> {
  // PGlite is a WASM build of real Postgres running in-process: no daemon, no
  // network socket, no DATABASE_URL. This is what lets the suites exercise the
  // real RLS engine and real triggers by default instead of skipping.
  const db = new PGlite()

  // Real migrations so the tests prove the actual shipped schema (isolation +
  // super-admin + audit), not a hand-written approximation of it.
  await applyAllMigrations((sql) => db.exec(sql))

  // Non-owner role: PGlite's default connection is the bootstrap superuser,
  // which bypasses RLS even with FORCE ROW LEVEL SECURITY. Without this role
  // switch, policy assertions would pass for the wrong reason.
  await db.exec(grantAppRoleSql(APP_ROLE))

  const connection = db as unknown as QueryableConnection

  return {
    db,
    query: (sql, params) => connection.query(sql, params),
    setTenant: (tenantId) => setConfig(connection, 'app.tenant_id', tenantId),
    setSuperAdmin: (isSuperAdmin) =>
      setConfig(connection, 'app.is_super_admin', isSuperAdmin ? 'true' : null),
    setActor: (actor) => setConfig(connection, 'app.actor', actor),
    async reset() {
      // Clean up AS THE OWNER: session variables are session-scoped and carry
      // over from the previous test. Deleting as app_user would only delete
      // rows visible under whatever scope leaked in (RLS's USING clause applies
      // to DELETE too), silently leaving other tenants' rows behind and making
      // test order matter. The owner bypasses RLS, so this clears the whole
      // table regardless of leftover state.
      await db.exec('reset role;')
      // audit_log is wiped with TRUNCATE, not DELETE, on purpose: the
      // append-only immutability trigger (0003) is a per-row BEFORE DELETE
      // trigger that fires for EVERYONE — even the owner — so a plain
      // "delete from audit_log" would itself be rejected as "append-only". That
      // is the guarantee working, not a bug. TRUNCATE removes all rows without
      // firing per-row triggers, so test setup can reset the ledger while the
      // ledger stays genuinely immutable to normal writes.
      //
      // Wrapped in a to_regclass guard so this same harness still resets
      // cleanly in a generated project where Keystone stripped the audit
      // migration: there the audit_log table does not exist, and an
      // unconditional TRUNCATE would throw. When the table is absent the block
      // is a no-op.
      await db.exec(`
        do $$
        begin
          if to_regclass('public.audit_log') is not null then
            truncate audit_log;
          end if;
        end
        $$;
      `)
      await db.exec('delete from items;')
      // Clear every session variable so no test inherits another's scope,
      // super-admin flag, or actor. Empty string is what the migrations treat
      // as "unset" (nullif(..., '')).
      await db.exec(`
        select set_config('app.tenant_id', '', false);
        select set_config('app.is_super_admin', '', false);
        select set_config('app.actor', '', false);
      `)
      // THEN switch to the non-owner role for the test body — this is what makes
      // RLS and the grants apply (not bypass) for every assertion.
      await db.exec(`set role ${APP_ROLE};`)
    },
    async close() {
      await db.close()
    },
  }
}

/**
 * Set the RLS/audit session variables on a raw pg Client (the optional
 * networked-Postgres path). Separate from the PGlite helpers because that path
 * uses the pg driver directly rather than the Harness object.
 */
export async function setClientConfig(
  client: Client,
  key: string,
  value: string | null,
): Promise<void> {
  await setConfig(client as unknown as QueryableConnection, key, value)
}
