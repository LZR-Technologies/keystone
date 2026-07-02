// @vitest-environment node
//
// Overrides the project-wide jsdom environment (vitest.config.ts) for this
// file only. PGlite's WASM/filesystem bootstrap calls a raw Response's
// `.arrayBuffer()` during startup; jsdom's fetch/Response polyfill does not
// implement it, so `db.exec()` throws "r.arrayBuffer is not a function"
// under jsdom. Real Node has no such gap. This test has no DOM dependency
// (no rendering, no hooks), so plain Node is also the more accurate
// environment for what it actually exercises.

/**
 * Integration test: tenant isolation via Row Level Security.
 *
 * Layer 3 of the test pyramid (CLAUDE.md, e2e/README.md). Runs against a
 * REAL Postgres, not a mock: a mocked repository would happily "pass" a
 * query the real database rejects, and no mock exercises an actual RLS
 * policy -- mocks lie about SQL and about security. This test proves the
 * policy in db/migrations/0001_initial_schema.sql actually blocks
 * cross-tenant reads and writes at the database level, independent of
 * anything application code remembers to do.
 *
 * Engine: @electric-sql/pglite, a WASM build of real Postgres that runs
 * in-process (no daemon, no network socket, no DATABASE_URL). This is what
 * makes the test RUN BY DEFAULT instead of skipping: `pnpm test` on a laptop
 * or CI runner with no Postgres installed still exercises the real engine,
 * the real migration file, and the real RLS policy -- not an approximation
 * of one. Deploy-time migrations against the actual staging/production
 * database (DATABASE_URL, scripts/db-migrate.sh) are a separate concern this
 * test does not touch.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATION_PATH = join(
  __dirname,
  '..',
  '..',
  '..',
  'db',
  'migrations',
  '0001_initial_schema.sql',
)

// Two arbitrary but fixed tenant ids: fixed (not random per run) so a failed
// assertion always reproduces the same rows if inspected manually.
const TENANT_A = '11111111-1111-1111-1111-111111111111'
const TENANT_B = '22222222-2222-2222-2222-222222222222'

// Non-owner role RLS is asserted against. PGlite (like real Postgres) makes
// the connecting owner/superuser BYPASS every row level security policy --
// FORCE ROW LEVEL SECURITY only forces the policy onto the table's owner,
// and the single implicit PGlite connection IS that owner. Without this
// role, every assertion below would pass even if the policy in the
// migration were deleted entirely, which would make the test worthless.
const APP_ROLE = 'app_user'

/**
 * Runs `fn` with the RLS session variable scoped to `tenantId` (or unset,
 * for the fail-closed case), under the non-owner role so the policy
 * actually applies. `set_config(..., false)` -- the `false` third argument
 * ("is_local") scopes the setting to the SESSION rather than the current
 * transaction, mirroring what the application sets once per request in
 * production (see the policy comment in 0001_initial_schema.sql).
 *
 * PGlite exposes one implicit connection/session (no pool), so `SET ROLE` /
 * `RESET ROLE` here reliably bracket exactly the statements run inside `fn`.
 */
async function withTenant<T>(
  db: PGlite,
  tenantId: string | null,
  fn: () => Promise<T>,
): Promise<T> {
  await db.exec(`set role ${APP_ROLE};`)
  await db.query('select set_config($1, $2, false)', ['app.tenant_id', tenantId ?? ''])
  try {
    return await fn()
  } finally {
    // Always drop back to the owner role, even if `fn` throws (a rejected
    // write is exactly what several assertions below expect) -- otherwise a
    // failing test would leave later tests running as app_user by accident.
    await db.exec('reset role;')
  }
}

describe('tenant isolation (RLS)', () => {
  let db: PGlite

  beforeAll(async () => {
    db = new PGlite()

    // Run the real migration so this test proves the actual shipped policy,
    // not a hand-written approximation of it. Idempotent (create table/
    // policy ... if not exists / drop policy if exists), matching the
    // production migration runner's expectations.
    const migrationSql = readFileSync(MIGRATION_PATH, 'utf8')
    await db.exec(migrationSql)

    // The migration itself only creates the `items` table and its policy --
    // it deliberately says nothing about application roles (that is a
    // deployment/provisioning concern, not schema). This test supplies its
    // own non-owner role so FORCE ROW LEVEL SECURITY has a role to bind to.
    // NOLOGIN: this role only exists to be SET ROLE'd into within this
    // process, never to authenticate a real connection.
    await db.exec(`create role ${APP_ROLE} nologin;`)
    await db.exec(`grant select, insert, update, delete on items to ${APP_ROLE};`)
  })

  afterAll(async () => {
    await db.close()
  })

  it('a session scoped to tenant A cannot read rows written by tenant B', async () => {
    await withTenant(db, TENANT_A, () =>
      db.query('insert into items (tenant_id, name) values ($1, $2)', [TENANT_A, 'tenant-a-item']),
    )
    await withTenant(db, TENANT_B, () =>
      db.query('insert into items (tenant_id, name) values ($1, $2)', [TENANT_B, 'tenant-b-item']),
    )

    // Still scoped to tenant B: a plain "select * from items" (no WHERE
    // tenant_id clause at all) must return ONLY tenant B's row. If the
    // policy were missing or misconfigured, this would return both rows.
    const result = await withTenant(db, TENANT_B, () =>
      db.query<{ name: string; tenant_id: string }>('select name, tenant_id from items'),
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({ name: 'tenant-b-item', tenant_id: TENANT_B })
  })

  it('a session with no tenant set sees zero rows, never everything', async () => {
    // No app.tenant_id set for this session at all -- simulates a request
    // that forgot to set the tenant. nullif(current_setting(...), '') must
    // resolve to NULL, and the policy's NULL comparison must match zero
    // rows: the fail-closed guarantee this migration exists to provide.
    const result = await withTenant(db, null, () => db.query('select * from items'))

    expect(result.rows).toHaveLength(0)
  })

  it('a write attempted for another tenant is rejected by the WITH CHECK clause', async () => {
    // Attempts to insert a row tagged with TENANT_B while the session is
    // scoped to TENANT_A. The policy's WITH CHECK clause (not just USING)
    // is what blocks this -- USING alone would only filter reads.
    await expect(
      withTenant(db, TENANT_A, () =>
        db.query('insert into items (tenant_id, name) values ($1, $2)', [
          TENANT_B,
          'cross-tenant-write-attempt',
        ]),
      ),
    ).rejects.toThrow(/row-level security/i)
  })

  it('the owning tenant reads exactly its own rows', async () => {
    // Closes the loop on the four properties: A's session sees neither zero
    // rows nor B's row, only the one row it is actually entitled to.
    const result = await withTenant(db, TENANT_A, () =>
      db.query<{ name: string; tenant_id: string }>('select name, tenant_id from items'),
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({ name: 'tenant-a-item', tenant_id: TENANT_A })
  })
})
