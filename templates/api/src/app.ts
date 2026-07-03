import Fastify from 'fastify'

import { logger } from './config/logger.js'
import { healthRoutes } from './modules/health/index.js'
import { errorHandler } from './shared/middleware/error-handler.js'
import { rateLimitPlugin } from './shared/middleware/rate-limit.js'

import type { FastifyInstance } from 'fastify'

/**
 * Builds and returns the Fastify application: plugins, hooks, security
 * headers, error handler, and routes.
 *
 * Decision: building the app is separated from listening (see server.ts) so
 * tests exercise the full HTTP surface with `app.inject()` — no port, no
 * network, no flakiness. This function must stay side-effect free beyond
 * constructing the instance.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    // Decision: Fastify's built-in logger is off because the project has a
    // single structured logger (pino, config/logger.ts) — two loggers means
    // two formats and split trace ids.
    logger: false,
    requestIdHeader: 'x-trace-id',
    genReqId: () => crypto.randomUUID(),
  })

  // Global error handler (RFC 9457 Problem Details) — every error leaves
  // the API through this one door.
  app.setErrorHandler(errorHandler)

  // Request logging — one line in, one line out, correlated by trace_id.
  app.addHook('onRequest', async (request) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        trace_id: request.id,
      },
      'Incoming request',
    )
  })

  app.addHook('onResponse', async (request, reply) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        status: reply.statusCode,
        duration_ms: reply.elapsedTime,
        trace_id: request.id,
      },
      'Request completed',
    )
  })

  // Security headers (OWASP secure headers baseline for a JSON API).
  app.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    // Decision: '0' disables the legacy XSS auditor — it is deprecated and
    // its heuristics introduced vulnerabilities of their own.
    reply.header('X-XSS-Protection', '0')
  })

  // Rate limit every route — a public API entry point must not be unbounded (manual §6).
  // Registered before routes so it protects all of them, defaults live in the plugin. The
  // counter is in-memory and per-process: correct for a single node; swap for a shared store
  // (e.g. Redis) when running more than one — called out so it is a conscious limit, not a
  // hidden one.
  await app.register(rateLimitPlugin, {})

  // Module routes — one register call per module, in src/modules/*.
  await app.register(healthRoutes)

  return app
}
