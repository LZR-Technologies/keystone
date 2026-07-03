// @vitest-environment node
//
// Runs in plain Node, not jsdom: PGlite's WASM bootstrap needs a real
// Response.arrayBuffer() that jsdom's polyfill lacks (see the fuller note in
// tenant-isolation.test.ts). This test has no DOM dependency anyway.

/**
 * Integration test: the append-only audit log (db/migrations/0003_audit_log.sql).
 *
 * Layer 3, real Postgres via PGlite through the shared harness. It proves the two
 * guarantees of 0003:
 *   (a) changing an audited row (insert then update on `items`) WRITES the
 *       matching ledger rows -- correct action, entity, and the actor from the
 *       per-session GUC; and
 *   (b) the ledger is IMMUTABLE -- UPDATE and DELETE on audit_log are rejected
 *       with an /append-only/ error, even from a role that holds the grant.
 *
 * The write path runs under the non-owner app role, proving the SECURITY DEFINER
 * writer logs the change WITHOUT the app holding any direct INSERT grant on
 * audit_log.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createMigrationsHarness, type MigrationsHarness } from './_migrations-harness'

const TENANT_A = '11111111-1111-1111-1111-111111111111'
const ACTOR = 'auditor@example.com'

interface AuditRow {
  action: string
  entity: string
  actor: string | null
  entity_id: string
  tenant_id: string
}

describe('audit log (append-only ledger)', () => {
  let harness: MigrationsHarness

  // 30s hook timeout (not the 10s default): PGlite's WASM cold boot is ~7s and,
  // under Vitest's parallel file runner, can exceed the default with transform
  // overhead. Slow, not hung -- see the fuller note in tenant-isolation.test.ts.
  beforeAll(async () => {
    harness = await createMigrationsHarness()
  }, 30_000)

  afterAll(async () => {
    await harness.close()
  })

  it('records insert then update of an items row, with the session actor', async () => {
    // Normal tenant session, with an actor set. The app role has NO grant on
    // audit_log -- the SECURITY DEFINER trigger is what writes the ledger, so a
    // successful log here also proves that privilege boundary.
    await harness.useAppRole()
    await harness.setTenant(TENANT_A)
    await harness.setActor(ACTOR)
    try {
      const inserted = await harness.db.query<{ id: string }>(
        'insert into items (tenant_id, name) values ($1, $2) returning id',
        [TENANT_A, 'audited-item'],
      )
      // Guard the indexed access (tsconfig has noUncheckedIndexedAccess): a
      // RETURNING insert always yields exactly one row. Throwing on the
      // impossible-empty case narrows the type WITHOUT a non-null assertion
      // (banned by lint) and gives a clear message if the invariant ever breaks.
      const insertedRow = inserted.rows[0]
      if (!insertedRow) throw new Error('insert ... returning id yielded no row')
      const itemId = insertedRow.id

      await harness.db.query('update items set name = $1 where id = $2', [
        'audited-item-renamed',
        itemId,
      ])

      // Read the ledger for this entity, oldest first, so the two rows are in
      // the order the changes happened.
      const log = await harness.db.query<AuditRow>(
        'select action, entity, actor, entity_id, tenant_id from audit_log where entity_id = $1 order by occurred_at',
        [itemId],
      )

      expect(log.rows).toHaveLength(2)
      // First the insert, then the update -- lowercased TG_OP, entity 'items',
      // the actor from app.actor, and the changed row's id and tenant captured.
      expect(log.rows[0]).toMatchObject({
        action: 'insert',
        entity: 'items',
        actor: ACTOR,
        entity_id: itemId,
        tenant_id: TENANT_A,
      })
      expect(log.rows[1]).toMatchObject({
        action: 'update',
        entity: 'items',
        actor: ACTOR,
        entity_id: itemId,
        tenant_id: TENANT_A,
      })
    } finally {
      await harness.reset()
    }
  })

  it('rejects UPDATE on audit_log as append-only', async () => {
    // Run as the OWNER (not the app role) to make the point sharply: even the
    // privileged role that holds UPDATE cannot rewrite the ledger, because the
    // immutability trigger fires before the change and raises. (There is at
    // least one ledger row from the previous test to target.)
    await expect(harness.db.query("update audit_log set action = 'tampered'")).rejects.toThrow(
      /append-only/i,
    )
  })

  it('rejects DELETE on audit_log as append-only', async () => {
    // Same guarantee for DELETE: history cannot be erased, only appended to.
    await expect(harness.db.query('delete from audit_log')).rejects.toThrow(/append-only/i)
  })
})
