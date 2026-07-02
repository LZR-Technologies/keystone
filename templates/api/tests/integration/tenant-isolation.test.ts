/**
 * Integration test: tenant isolation via Row Level Security.
 *
 * Layer 3 of the test pyramid (tests/README.md). Runs against a REAL
 * Postgres, not a mock: a mocked repository would happily "pass" a query the
 * real database rejects, and no mock exercises an actual RLS policy — mocks
 * lie about SQL and about security. This test proves the policy in
 * db/migrations/0001_initial_schema.sql actually blocks cross-tenant reads
 * and writes at the database level, independent of anything the application
 * code remembers to do.
 *
 * Decision: the default path runs against @electric-sql/pglite — a WASM
 * build of real Postgres that starts in-process, no daemon, no DATABASE_URL.
 * That makes this test exercise the real migration and the real RLS engine
 * on every `pnpm test` run, on a laptop or in CI, with nothing to provision.
 * A previous version of this file skipped entirely when DATABASE_URL was
 * unset, which meant RLS was never actually exercised in the default run —
 * that gap is what this rewrite closes.
 *
 * A second, optional suite below runs the identical properties against a
 * real networked Postgres when DATABASE_URL is set, for CI parity with a
 * production-like engine. It is additive, not a replacement for the default
 * in-process run.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PGlite } from '@electric-sql/pglite'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATION_PATH = join(__dirname, '..', '..', 'db', 'migrations', '0001_initial_schema.sql')
const MIGRATION_SQL = readFileSync(MIGRATION_PATH, 'utf8')

// Two arbitrary but fixed tenant ids: fixed (not random per run) so a failed
// assertion always reproduces the same rows if inspected manually.
const TENANT_A = '11111111-1111-1111-1111-111111111111'
const TENANT_B = '22222222-2222-2222-2222-222222222222'

// Non-owner role RLS is proven against. RLS (even with FORCE) is bypassed
// for the table owner / connecting superuser, so asserting anything about
// the policy requires a session running as a role that only holds the
// grants below — otherwise every test would "pass" for the wrong reason.
const APP_ROLE = 'app_user'

/**
 * Minimal shape both drivers (pg's Client and PGlite) satisfy for the calls
 * this test needs. Lets the four property assertions below run unchanged
 * against either backend instead of being duplicated per-driver.
 */
interface QueryableConnection {
  query(sql: string, params?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>
}

/**
 * Sets the RLS session variable for the current connection, mirroring what
 * the application does per-request in production (see the policy comment in
 * 0001_initial_schema.sql). The `false` third argument makes the setting
 * session-scoped (not transaction-local) — both backends here run each test
 * as a sequence of separate statements, not inside one open transaction, so
 * a transaction-scoped setting would not survive between them.
 */
async function setTenant(connection: QueryableConnection, tenantId: string | null): Promise<void> {
  await connection.query('select set_config($1, $2, false)', ['app.tenant_id', tenantId ?? ''])
}

/**
 * The four tenant-isolation properties the RLS policy in
 * 0001_initial_schema.sql exists to guarantee. Shared between the default
 * PGlite run and the optional networked-Postgres run so both backends prove
 * exactly the same contract — divergence here would let one path go stale
 * without the other catching it.
 */
function runTenantIsolationProperties(getConnection: () => QueryableConnection): void {
  it('the owning tenant reads exactly its own rows', async () => {
    const connection = getConnection()
    await setTenant(connection, TENANT_A)
    await connection.query('insert into items (tenant_id, name) values ($1, $2)', [
      TENANT_A,
      'tenant-a-item',
    ])

    const result = await connection.query('select name, tenant_id from items')

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({ name: 'tenant-a-item', tenant_id: TENANT_A })
  })

  it("a second tenant reads 0 of the first tenant's rows", async () => {
    const connection = getConnection()
    await setTenant(connection, TENANT_A)
    await connection.query('insert into items (tenant_id, name) values ($1, $2)', [
      TENANT_A,
      'tenant-a-item',
    ])

    // Still scoped to tenant B: a plain "select * from items" (no WHERE
    // tenant_id clause at all) must return NOTHING of tenant A's. If the
    // policy were missing or misconfigured, this would return tenant A's row.
    await setTenant(connection, TENANT_B)
    const result = await connection.query('select name, tenant_id from items')

    expect(result.rows.every((row) => row.tenant_id !== TENANT_A)).toBe(true)
  })

  it('a second tenant cannot INSERT a row tagged as the first tenant', async () => {
    const connection = getConnection()
    await setTenant(connection, TENANT_B)

    // The policy's WITH CHECK clause (not just USING) is what blocks this —
    // USING alone would only filter reads, not validate writes.
    await expect(
      connection.query('insert into items (tenant_id, name) values ($1, $2)', [
        TENANT_A,
        'cross-tenant-write-attempt',
      ]),
    ).rejects.toThrow(/row-level security/i)
  })

  it('with no app.tenant_id set, 0 rows are visible (fail-closed)', async () => {
    const connection = getConnection()
    await setTenant(connection, TENANT_A)
    await connection.query('insert into items (tenant_id, name) values ($1, $2)', [
      TENANT_A,
      'tenant-a-item',
    ])

    // No set_config call for app.tenant_id at all from here — simulates a
    // request that forgot to set the tenant. nullif(current_setting(...), '')
    // must resolve to NULL, and the policy's NULL comparison must match zero
    // rows: the fail-closed guarantee this migration exists to provide.
    await setTenant(connection, null)

    const result = await connection.query('select * from items')

    expect(result.rows).toHaveLength(0)
  })
}

describe('tenant isolation (RLS) — in-process Postgres via PGlite', () => {
  let db: PGlite

  beforeAll(async () => {
    // PGlite is a WASM build of real Postgres running in-process: no
    // daemon, no network socket, no DATABASE_URL. This is what makes the
    // suite exercise the real RLS engine by default instead of skipping.
    db = new PGlite()

    // Run the real migration so this test proves the actual shipped policy,
    // not a hand-written approximation of it.
    await db.exec(MIGRATION_SQL)

    // Non-owner role: PGlite's default connection is the bootstrap
    // superuser, which bypasses RLS even with FORCE ROW LEVEL SECURITY.
    // Without this role switch, every property below would pass for the
    // wrong reason (superuser sees everything, not "the policy allows it").
    await db.exec(`
      drop role if exists ${APP_ROLE};
      create role ${APP_ROLE} nologin;
      grant select, insert, update, delete on items to ${APP_ROLE};
    `)
  })

  afterAll(async () => {
    await db?.close()
  })

  beforeEach(async () => {
    // Reset to the owner role for cleanup: app.tenant_id is session-scoped
    // (see setTenant's "false" argument) and carries over from whichever
    // test ran previously. Deleting AS app_user here would only delete rows
    // visible under that leftover scope (RLS's USING clause applies to
    // DELETE too) — silently leaving other tenants' rows behind and making
    // test order matter. The owner bypasses RLS, so this always clears the
    // whole table regardless of what the previous test left set.
    await db.exec('reset role;')
    await db.exec('delete from items;')

    // THEN switch to the non-owner role for the test itself — this is what
    // makes RLS apply (not bypass) for every assertion in the test body.
    await db.exec(`set role ${APP_ROLE};`)
  })

  runTenantIsolationProperties(() => db as unknown as QueryableConnection)
})

// Optional CI-parity path: identical properties against a real networked
// Postgres when DATABASE_URL is set. Skips cleanly otherwise — the suite's
// default green run never depends on external infrastructure, PGlite above
// already proves the policy for real on every run.
describe.skipIf(!process.env.DATABASE_URL)(
  'tenant isolation (RLS) — networked Postgres via DATABASE_URL',
  () => {
    let client: Client

    beforeAll(async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by describe.skipIf above
      client = new Client({ connectionString: process.env.DATABASE_URL! })
      await client.connect()

      await client.query(MIGRATION_SQL)

      await client.query(`
        do $$
        begin
          if not exists (select 1 from pg_roles where rolname = '${APP_ROLE}') then
            create role ${APP_ROLE} nologin;
          end if;
        end
        $$;
      `)
      await client.query(`grant select, insert, update, delete on items to ${APP_ROLE};`)
    })

    afterAll(async () => {
      await client?.end()
    })

    beforeEach(async () => {
      // Same ordering as the PGlite suite above, and for the same reason:
      // clean up as the owner (bypasses RLS, always clears the whole table)
      // BEFORE switching to the non-owner role the test body runs as.
      await client.query('reset role;')
      await client.query('delete from items;')
      await client.query(`set role ${APP_ROLE};`)
    })

    runTenantIsolationProperties(() => client as unknown as QueryableConnection)
  },
)
