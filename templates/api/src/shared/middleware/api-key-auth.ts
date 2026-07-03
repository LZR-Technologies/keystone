import { createHash } from 'node:crypto'

import { HTTP } from '../constants/http.js'

import type { FastifyRequest, FastifyReply } from 'fastify'

export interface ApiKeyContext {
  keyId: string
  name: string
  scopes: string[]
}

// Why: extending Fastify's request type avoids the `any` cast when attaching
// the api key context. Use module augmentation in real projects.
type RequestWithApiKey = FastifyRequest & { apiKey?: ApiKeyContext }

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Builds a preHandler that authenticates a request by its `X-API-Key` header. A provided
 * utility, not wired globally on purpose: only routes that need machine auth should use it,
 * and it depends on a project-specific `lookupKey` (how keys are stored). Attach it per route:
 *
 *   app.get('/reports', { preHandler: createApiKeyAuth(lookupKey, 'reports:read') }, handler)
 */
export function createApiKeyAuth(
  lookupKey: (hash: string) => Promise<{
    id: string
    name: string
    scopes: string[]
    isActive: boolean
    expiresAt: string | null
  } | null>,
  requiredScope?: string,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Respond with RFC 9457 Problem Details directly (this runs as a preHandler, ahead of the
    // global error handler's reach), so an auth failure looks like every other API error.
    const deny = (status: number, title: string, detail: string) =>
      reply
        .code(status)
        .header('content-type', 'application/problem+json')
        .send({
          type: `https://api.example.com/errors/${title.toLowerCase().replace(/ /g, '-')}`,
          title,
          status,
          detail,
          trace_id: request.id,
        })

    const apiKey = request.headers['x-api-key'] as string | undefined
    if (!apiKey) return deny(HTTP.UNAUTHORIZED, 'Unauthorized', 'X-API-Key header required')
    const record = await lookupKey(hashApiKey(apiKey))
    if (!record) return deny(HTTP.UNAUTHORIZED, 'Unauthorized', 'Invalid API key')
    if (!record.isActive) return deny(HTTP.FORBIDDEN, 'Forbidden', 'API key deactivated')
    if (record.expiresAt && new Date(record.expiresAt) < new Date())
      return deny(HTTP.FORBIDDEN, 'Forbidden', 'API key expired')
    if (requiredScope && !record.scopes.includes('*') && !record.scopes.includes(requiredScope))
      return deny(HTTP.FORBIDDEN, 'Forbidden', 'Insufficient scope')
    ;(request as RequestWithApiKey).apiKey = {
      keyId: record.id,
      name: record.name,
      scopes: record.scopes,
    }
  }
}
