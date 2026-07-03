/**
 * Integration test: append-only audit log via db/migrations/0003_audit_log.sql.
 *
 * Layer 3 of the test pyramid (tests/README.md). Runs against a REAL Postgres
 * (PGlite) with the full migration set applied, as the non-owner app_user role.
 * Triggers and privilege behavior only exist in a real database — a mock would
 * prove nothing here.
 *
 * This proves the two halves of the audit-log contract:
 *   (a) writing items records the change: an INSERT then an UPDATE produce the
 *       matching audit_log rows (action insert/update, entity 'items', actor
 *       taken from app.actor) — the trigger captures history automatically,
 *       even though the app has no direct INSERT grant on audit_log (the
 *       trigger writes it as SECURITY DEFINER);
 *   (b) the log is append-only: an UPDATE and a DELETE against audit_log are
 *       REJECTED by the immutability trigger — and rejected for the app_user
 *       role that HOLDS update/delete grants, so the block comes from the
 *       trigger, not from a missing privilege.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createHarness, type Harness } from './_migrations-harness.js'

const TENANT_A = '11111111-1111-1111-1111-111111111111'
const ACTOR = 'user-42'

describe('audit log (append-only ledger) — in-process Postgres via PGlite', () => {
  let harness: Harness

  beforeAll(async () => {
    harness = await createHarness()
  })

  afterAll(async () => {
    await harness?.close()
  })

  beforeEach(async () => {
    await harness.reset()
  })

  it('records an insert and a subsequent update of an item', async () => {
    // Scope the session like a real request: a tenant (so the write passes RLS)
    // and an actor (so the trigger has someone to attribute the change to).
    await harness.setTenant(TENANT_A)
    await harness.setActor(ACTOR)

    // Insert, then update the same row — two audited writes.
    const inserted = await harness.query(
      'insert into items (tenant_id, name) values ($1, $2) returning id',
      [TENANT_A, 'original-name'],
    )
    // An INSERT ... RETURNING of a single row yields exactly one row. Guard it
    // with a throw (not just expect) so a broken insert fails here with a clear
    // message AND TypeScript narrows the row from possibly-undefined — indexing
    // blindly would either crash confusingly downstream or need an unsafe cast.
    const insertedRow = inserted.rows[0]
    if (!insertedRow) throw new Error('expected the inserted item to be returned')
    const itemId = insertedRow.id as string
    await harness.query('update items set name = $1 where id = $2', ['renamed', itemId])

    // The trigger writes audit_log as SECURITY DEFINER (owner), so the rows are
    // there regardless of the caller's RLS scope. Read them back in order.
    const log = await harness.query(
      'select action, entity, entity_id, actor from audit_log where entity_id = $1 order by occurred_at',
      [itemId],
    )

    expect(log.rows).toHaveLength(2)
    // First the insert, then the update — both attributed to app.actor, both on
    // the 'items' entity, both pointing at the row that changed.
    expect(log.rows[0]).toMatchObject({
      action: 'insert',
      entity: 'items',
      entity_id: itemId,
      actor: ACTOR,
    })
    expect(log.rows[1]).toMatchObject({
      action: 'update',
      entity: 'items',
      entity_id: itemId,
      actor: ACTOR,
    })
  })

  it('rejects UPDATE and DELETE against audit_log (append-only)', async () => {
    // Produce one audit_log row to attempt to mutate. Without a real row, the
    // BEFORE UPDATE/DELETE trigger would never fire (for-each-row triggers only
    // run on matched rows) and the test would prove nothing.
    await harness.setTenant(TENANT_A)
    await harness.setActor(ACTOR)
    await harness.query('insert into items (tenant_id, name) values ($1, $2)', [
      TENANT_A,
      'audited-item',
    ])

    // app_user holds update/delete grants on audit_log (see grantAppRoleSql), so
    // reaching the trigger — not a "permission denied" — is what these assert.
    // The rejection must name the append-only rule.
    await expect(harness.query("update audit_log set actor = 'tampered'")).rejects.toThrow(
      /append-only/i,
    )
    await expect(harness.query('delete from audit_log')).rejects.toThrow(/append-only/i)
  })
})
