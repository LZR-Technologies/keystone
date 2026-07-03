// Shared harness for the database integration tests (tenant isolation,
// super-admin, audit log). Each of those tests needs the SAME real-Postgres
// setup: a PGlite instance with EVERY migration applied in order and a non-owner
// role to prove RLS against. Rather than copy that bootstrap into each file (and
// let the copies drift), it lives here once.
//
// Underscore prefix (_migrations-harness) and the .ts (not .test.ts) extension
// keep Vitest from collecting it as a test file -- it has no tests of its own,
// only setup used BY the tests. It sits under src/__tests__/, which the coverage
// config excludes wholesale (see vitest.config.ts, `src/__tests__/**`), so this
// shared helper never counts toward the 100% source-coverage surface -- it is
// test scaffolding, not shipped product code.

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PGlite } from '@electric-sql/pglite'

const __dirname = dirname(fileURLToPath(import.meta.url))

// The migrations directory, resolved relative to this file so the tests reflect
// the SAME SQL that ships to a real database -- not a hand-written copy.
const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'db', 'migrations')

// Non-owner role every RLS assertion runs as. PGlite's single implicit
// connection IS the table owner, and an owner BYPASSES row level security even
// under FORCE ROW LEVEL SECURITY (FORCE only forces the policy onto the owner of
// the TABLE, which is still bypassed by a superuser owner connection). Without
// switching into this role, isolation assertions would pass even with the policy
// deleted -- making them worthless. The tests SET ROLE into it to feel the policy.
export const APP_ROLE = 'app_user'

/**
 * A ready-to-use test database: every migration applied, the non-owner role
 * created and granted, and small helpers to drive the per-session GUCs the
 * policies and triggers read (tenant, super-admin, actor).
 */
export interface MigrationsHarness {
  db: PGlite
  /** Scope the session to a tenant (or clear it with null) for the fail-closed case. */
  setTenant(tenantId: string | null): Promise<void>
  /** Turn the per-session super-admin flag on or off. */
  setSuperAdmin(enabled: boolean): Promise<void>
  /** Set (or clear, with null) the actor recorded by the audit log. */
  setActor(actor: string | null): Promise<void>
  /** Enter the non-owner role so RLS policies actually apply to the statements that follow. */
  useAppRole(): Promise<void>
  /** Drop back to the owner role and clear every session GUC, isolating one test from the next. */
  reset(): Promise<void>
  /** Close the underlying PGlite instance (call in afterAll). */
  close(): Promise<void>
}

/** Every `*.sql` file in db/migrations, in filename order (which is apply order). */
function migrationFilesInOrder(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort()
}

/**
 * Build a fresh harness: spin up PGlite, apply ALL migrations in order (not just
 * 0001 -- the tests must reflect the complete real schema, including the optional
 * super-admin and audit-log migrations), then create the non-owner app role.
 *
 * The role is granted on ALL current tables in `public`, so it covers `items`
 * AND `audit_log` without naming them one by one -- a table added by a future
 * migration is picked up by re-running the grant, not by editing this helper.
 * Note the app role is deliberately NOT granted anything special on audit_log's
 * triggers: it can INSERT into items and thereby cause a log write (via the
 * SECURITY DEFINER writer), which is exactly the privilege boundary under test.
 */
export async function createMigrationsHarness(): Promise<MigrationsHarness> {
  const db = new PGlite()

  // Apply every migration in order. Each file is idempotent (create ... if not
  // exists / drop ... if exists), matching the production runner's expectations.
  for (const file of migrationFilesInOrder()) {
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'))
  }

  // The migrations say nothing about application roles (provisioning, not schema),
  // so the harness supplies the non-owner role. NOLOGIN: it exists only to be SET
  // ROLE'd into within this process, never to authenticate a real connection.
  await db.exec(`create role ${APP_ROLE} nologin;`)
  await db.exec(
    `grant select, insert, update, delete on all tables in schema public to ${APP_ROLE};`,
  )

  // set_config(name, value, false): the `false` (is_local) scopes the GUC to the
  // SESSION, mirroring how the app sets it once per request. PGlite has one
  // implicit session, so these settings persist across statements until reset.
  const setGuc = async (name: string, value: string): Promise<void> => {
    await db.query('select set_config($1, $2, false)', [name, value])
  }

  return {
    db,
    // null -> '' so an "unset" tenant hits the same fail-closed path as production
    // (nullif('', '') = NULL in the policy), rather than throwing a cast error.
    setTenant: (tenantId) => setGuc('app.tenant_id', tenantId ?? ''),
    setSuperAdmin: (enabled) => setGuc('app.is_super_admin', enabled ? 'true' : 'false'),
    setActor: (actor) => setGuc('app.actor', actor ?? ''),
    useAppRole: async () => {
      await db.exec(`set role ${APP_ROLE};`)
    },
    reset: async () => {
      // Back to the owner first, THEN clear the GUCs: clearing runs as owner, and
      // dropping the role association here means a test that threw mid-statement
      // (a rejected write is an EXPECTED outcome in several tests) never leaks the
      // app role or a stale tenant/actor into the next test.
      await db.exec('reset role;')
      await setGuc('app.tenant_id', '')
      await setGuc('app.is_super_admin', 'false')
      await setGuc('app.actor', '')
    },
    close: () => db.close(),
  }
}
