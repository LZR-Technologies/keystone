import Fastify from 'fastify'

import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { healthRoutes } from './features/health/index.js'
import { errorHandler } from './shared/middleware/error-handler.js'

async function bootstrap(): Promise<void> {
  const app = Fastify({
    logger: false, // Usamos nosso próprio logger (pino)
    requestIdHeader: 'x-trace-id',
    genReqId: () => crypto.randomUUID(),
  })

  // Error handler global (RFC 9457)
  app.setErrorHandler(errorHandler)

  // Request logging
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

  // Security headers (Handbook: OWASP)
  app.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    reply.header('X-XSS-Protection', '0')
  })

  // Routes
  await app.register(healthRoutes)

  // Start
  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`)
  } catch (err) {
    logger.fatal(err, 'Failed to start server')
    process.exit(1)
  }
}

bootstrap()
