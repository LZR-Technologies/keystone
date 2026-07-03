import Fastify from 'fastify'
import { afterAll, describe, expect, it } from 'vitest'

import { HTTP } from '../../constants/http.js'
import { rateLimitPlugin } from '../rate-limit.js'

import type { FastifyInstance } from 'fastify'

describe('rateLimitPlugin', () => {
  let app: FastifyInstance

  afterAll(async () => {
    await app.close()
  })

  it('lets requests through until the window limit, then answers 429', async () => {
    app = Fastify({ logger: false })
    // A tiny limit and a wide window make the cutoff deterministic — the
    // whole test runs well inside one window, no timers to fake.
    await app.register(rateLimitPlugin, { max: 2, windowMs: 60_000 })
    app.get('/ping', async () => ({ pong: true }))

    const first = await app.inject({ method: 'GET', url: '/ping' })
    const second = await app.inject({ method: 'GET', url: '/ping' })
    const third = await app.inject({ method: 'GET', url: '/ping' })

    expect(first.statusCode).toBe(HTTP.OK)
    expect(second.statusCode).toBe(HTTP.OK)
    expect(third.statusCode).toBe(HTTP.TOO_MANY_REQUESTS)
    // RFC 9457 Problem Details body + a Retry-After header telling the client when to retry.
    expect(third.headers['content-type']).toContain('application/problem+json')
    expect(third.headers['retry-after']).toBeDefined()
    const problem = third.json<{ title: string; status: number }>()
    expect(problem.title).toBe('Too Many Requests')
    expect(problem.status).toBe(HTTP.TOO_MANY_REQUESTS)
  })
})
