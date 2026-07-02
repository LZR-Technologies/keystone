import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

import { logger } from '../../config/logger.js'
import { HTTP } from '../constants/http.js'
import { AppError } from '../types/error.js'

/**
 * Global error handler — returns RFC 9457 Problem Details
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const traceId = request.id

  if (error instanceof AppError) {
    const problemDetail = error.toProblemDetail(request.url, traceId)

    logger.warn({ err: error, trace_id: traceId }, error.detail)

    reply
      .status(error.status)
      .header('content-type', 'application/problem+json')
      .send(problemDetail)
    return
  }

  // Unexpected error — log and return a generic 500
  logger.error({ err: error, trace_id: traceId }, 'Unhandled error')

  reply.status(HTTP.INTERNAL_SERVER_ERROR).header('content-type', 'application/problem+json').send({
    type: 'https://api.example.com/errors/internal',
    title: 'Internal Server Error',
    status: HTTP.INTERNAL_SERVER_ERROR,
    detail: 'An unexpected error occurred',
    trace_id: traceId,
  })
}
