import type { FastifyInstance } from 'fastify'

/**
 * Health check endpoint
 * GET /api/v1/health
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  })
}
