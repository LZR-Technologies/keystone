import { describe, it, expect } from 'vitest'

import { PATCH } from '../../../../../../app/api/v1/items/[id]/route'

import type { ProblemDetail } from '@/lib/types'

// Covers every branch of the PATCH handler in file order: malformed JSON,
// schema-invalid body, unknown id, and the success path. Each failure
// returns an RFC 9457 Problem Detail -- asserting the exact status/title
// pins the contract src/lib/fetch.ts's client-side parsing depends on.
describe('PATCH /api/v1/items/[id]', () => {
  const SEEDED_ID = '11111111-1111-4111-8111-111111111111'

  function patchRequest(body: unknown): Request {
    return new Request('http://localhost/api/v1/items/x', {
      method: 'PATCH',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  }

  it('returns 400 Bad Request when the body is not valid JSON', async () => {
    const response = await PATCH(patchRequest('not json'), { params: Promise.resolve({ id: 'x' }) })
    const problem = (await response.json()) as ProblemDetail

    expect(response.status).toBe(400)
    expect(problem).toMatchObject({ title: 'Bad Request', status: 400 })
    expect(problem.detail).toContain('valid JSON')
  })

  it('returns 400 Bad Request when name is missing (schema validation fails)', async () => {
    const response = await PATCH(patchRequest({}), { params: Promise.resolve({ id: 'x' }) })
    const problem = (await response.json()) as ProblemDetail

    expect(response.status).toBe(400)
    expect(problem.title).toBe('Bad Request')
  })

  it('returns 400 Bad Request when name is an empty string', async () => {
    const response = await PATCH(patchRequest({ name: '   ' }), {
      params: Promise.resolve({ id: 'x' }),
    })
    const problem = (await response.json()) as ProblemDetail

    expect(response.status).toBe(400)
    expect(problem.detail).toContain('must not be empty')
  })

  it('returns 404 Not Found when no item matches the id', async () => {
    const response = await PATCH(patchRequest({ name: 'New name' }), {
      params: Promise.resolve({ id: 'does-not-exist' }),
    })
    const problem = (await response.json()) as ProblemDetail

    expect(response.status).toBe(404)
    expect(problem.title).toBe('Not Found')
    expect(problem.detail).toContain('does-not-exist')
  })

  it('returns 200 with the updated item on a valid rename', async () => {
    const response = await PATCH(patchRequest({ name: 'Renamed via route test' }), {
      params: Promise.resolve({ id: SEEDED_ID }),
    })
    const updated = (await response.json()) as { id: string; name: string }

    expect(response.status).toBe(200)
    expect(updated).toMatchObject({ id: SEEDED_ID, name: 'Renamed via route test' })
  })
})
