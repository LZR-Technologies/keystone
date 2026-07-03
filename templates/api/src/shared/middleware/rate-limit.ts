import { HTTP } from '../constants/http.js'

import type { FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify'

interface RateLimitOptions {
  // Optional so the plugin can be registered with `{}` and fall back to the defaults below;
  // a project tunes these per its own traffic.
  max?: number
  windowMs?: number
}

const DEFAULT_MAX_REQUESTS = 60
const DEFAULT_WINDOW_MS = 60_000
const MS_PER_SECOND = 1000

const requests = new Map<string, number[]>()

export const rateLimitPlugin: FastifyPluginCallback<RateLimitOptions> = (fastify, opts, done) => {
  const { max = DEFAULT_MAX_REQUESTS, windowMs = DEFAULT_WINDOW_MS } = opts
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.ip
    const now = Date.now()
    const timestamps = (requests.get(key) ?? []).filter((t) => now - t < windowMs)
    if (timestamps.length >= max) {
      // RFC 9457 Problem Details (same shape the global error handler emits) plus a
      // Retry-After header so a well-behaved client knows when to try again — the manual
      // requires both for a public entry point's limit, not a bare `{ error }`.
      // Retry-After is the full window: a deliberately conservative estimate (never tells a
      // client to retry too early) that avoids tracking the exact oldest timestamp.
      const retryAfterSeconds = Math.ceil(windowMs / MS_PER_SECOND)
      reply
        .code(HTTP.TOO_MANY_REQUESTS)
        .header('content-type', 'application/problem+json')
        .header('retry-after', String(retryAfterSeconds))
        .send({
          type: 'https://api.example.com/errors/rate-limit',
          title: 'Too Many Requests',
          status: HTTP.TOO_MANY_REQUESTS,
          detail: `Rate limit of ${max} requests per ${Math.round(windowMs / MS_PER_SECOND)}s exceeded.`,
          trace_id: request.id,
        })
      return
    }
    timestamps.push(now)
    requests.set(key, timestamps)
  })
  done()
}

// Why: Fastify encapsulates plugins — a hook added inside a plugin applies
// only to routes registered in that plugin's own context, so without this
// flag the limiter silently protected NOTHING (caught by the test suite).
// The skip-override symbol is exactly what the `fastify-plugin` package sets;
// inlining it avoids adding a dependency for one boolean.
;(rateLimitPlugin as FastifyPluginCallback<RateLimitOptions> & Record<symbol, boolean>)[
  Symbol.for('skip-override')
] = true
