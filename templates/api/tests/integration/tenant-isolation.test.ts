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
 * The four properties below still hold with the super-admin migration (0002)
 * applied: the widened policy is "own tenant OR is_super_admin()", and the
 * shared harness never sets app.is_super_admin here, so is_super_admin()
 * defaults to false and the OR collapses back to plain tenant isolation. That
 * is the point of proving it against the FULL migrated schema — isolation must
 * survive the presence of the super-admin escape hatch, not just its absence.
 *
 * Decision: the default path runs against @electric-sql/pglite via the shared
 * harness (_migrations-harness.ts), which applies EVERY migration in order —
 * an in-process WASM build of real Postgres, no daemon, no DATABASE_URL. That
 * makes this test exercise the real migrations and the real RLS engine on every
 * `pnpm test` run. A previous version applied only 0001 by hand, so the shipped
 * super-admin and audit-log migrations were never present during the test —
 * that gap is what the harness closes.
 *
 * A second, optional suite below runs the identical properties against a real
 * networked Postgres when DATABASE_URL is set, for CI parity with a
 * production-like engine. It is additive, not a replacement for the default
 * in-process run, and applies the same full migration set.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  APP_ROLE,
  applyAllMigrations,
  createHarness,
  grantAppRoleSql,
  setClientConfig,
  type Harness,
  type QueryableConnection,
} from './_migrations-harness.js'

// Two arbitrary but fixed tenant ids: fixed (not random per run) so a failed
// assertion always reproduces the same rows if inspected manually.
const TENANT_A = '11111111-1111-1111-1111-111111111111'
const TENANT_B = '22222222-2222-2222-2222-222222222222'

/**
 * The four tenant-isolation properties the RLS policy exists to guarantee.
 * `setTenant` and `getConnection` are injected so the identical contract runs
 * against both the PGlite harness and the optional networked-Postgres client —
 * divergence here would let one path go stale without the other catching it.
 */
function runTenantIsolationProperties(
  setTenant: (tenantId: string | null) => Promise<void>,
  getConnection: () => QueryableConnection,
): void {
  it('the owning tenant reads exactly its own rows', async () => {
    await setTenant(TENANT_A)
    await getConnection().query('insert into items (tenant_id, name) values ($1, $2)', [
      TENANT_A,
      'tenant-a-item',
    ])

    const result = await getConnection().query('select name, tenant_id from items')

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({ name: 'tenant-a-item', tenant_id: TENANT_A })
  })

  it("a second tenant reads 0 of the first tenant's rows", async () => {
    await setTenant(TENANT_A)
    await getConnection().query('insert into items (tenant_id, name) values ($1, $2)', [
      TENANT_A,
      'tenant-a-item',
    ])

    // Still scoped to tenant B: a plain "select * from items" (no WHERE
    // tenant_id clause at all) must return NOTHING of tenant A's. If the
    // policy were missing or misconfigured, this would return tenant A's row.
    await setTenant(TENANT_B)
    const result = await getConnection().query('select name, tenant_id from items')

    expect(result.rows.every((row) => row.tenant_id !== TENANT_A)).toBe(true)
  })

  it('a second tenant cannot INSERT a row tagged as the first tenant', async () => {
    await setTenant(TENANT_B)

    // The policy's WITH CHECK clause (not just USING) is what blocks this —
    // USING alone would only filter reads, not validate writes.
    await expect(
      getConnection().query('insert into items (tenant_id, name) values ($1, $2)', [
        TENANT_A,
        'cross-tenant-write-attempt',
      ]),
    ).rejects.toThrow(/row-level security/i)
  })

  it('with no app.tenant_id set, 0 rows are visible (fail-closed)', async () => {
    await setTenant(TENANT_A)
    await getConnection().query('insert into items (tenant_id, name) values ($1, $2)', [
      TENANT_A,
      'tenant-a-item',
    ])

    // No tenant set from here — simulates a request that forgot to set the
    // tenant. nullif(current_setting(...), '') must resolve to NULL, and the
    // policy's NULL comparison must match zero rows: the fail-closed guarantee
    // this migration exists to provide. (is_super_admin() is also false here,
    // so the OR does not open a hole.)
    await setTenant(null)

    const result = await getConnection().query('select * from items')

    expect(result.rows).toHaveLength(0)
  })
}

describe('tenant isolation (RLS) — in-process Postgres via PGlite', () => {
  let harness: Harness

  beforeAll(async () => {
    // Full migrated schema (0001 + 0002 + 0003) + the non-owner app role, so
    // isolation is proven against exactly what ships, super-admin escape hatch
    // and audit triggers included.
    harness = await createHarness()
  })

  afterAll(async () => {
    await harness?.close()
  })

  beforeEach(async () => {
    // Owner-side cleanup + clear session vars + switch to the non-owner role.
    // See the harness reset() comment for why cleanup runs as the owner.
    await harness.reset()
  })

  runTenantIsolationProperties(
    (tenantId) => harness.setTenant(tenantId),
    () => harness.db as unknown as QueryableConnection,
  )
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

      // Same full migration set and same role grants as the PGlite path, via
      // the shared harness helpers — the two backends prove one identical
      // schema, never a drifted subset.
      await applyAllMigrations((sql) => client.query(sql))
      await client.query(grantAppRoleSql(APP_ROLE))
    })

    afterAll(async () => {
      await client?.end()
    })

    beforeEach(async () => {
      // Same ordering as the harness reset(): clean up as the owner (bypasses
      // RLS, always clears the whole table) and clear session vars BEFORE
      // switching to the non-owner role the test body runs as.
      await client.query('reset role;')
      // TRUNCATE, not DELETE: the append-only trigger (0003) rejects DELETE on
      // audit_log even for the owner. Guarded with to_regclass so a project
      // where the audit migration was stripped still resets cleanly. Same
      // reasoning as the harness reset().
      await client.query(`
        do $$
        begin
          if to_regclass('public.audit_log') is not null then
            truncate audit_log;
          end if;
        end
        $$;
      `)
      await client.query('delete from items;')
      await setClientConfig(client, 'app.tenant_id', null)
      await setClientConfig(client, 'app.is_super_admin', null)
      await setClientConfig(client, 'app.actor', null)
      await client.query(`set role ${APP_ROLE};`)
    })

    runTenantIsolationProperties(
      (tenantId) => setClientConfig(client, 'app.tenant_id', tenantId),
      () => client as unknown as QueryableConnection,
    )
  },
)
