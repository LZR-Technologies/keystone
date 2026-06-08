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

export function createApiKeyAuth(
  lookupKey: (
    hash: string,
  ) => Promise<{
    id: string
    name: string
    scopes: string[]
    isActive: boolean
    expiresAt: string | null
  } | null>,
  requiredScope?: string,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers['x-api-key'] as string | undefined
    if (!apiKey) {
      reply.code(HTTP.UNAUTHORIZED).send({ error: 'X-API-Key header required' })
      return
    }
    const record = await lookupKey(hashApiKey(apiKey))
    if (!record) {
      reply.code(HTTP.UNAUTHORIZED).send({ error: 'Invalid API key' })
      return
    }
    if (!record.isActive) {
      reply.code(HTTP.FORBIDDEN).send({ error: 'API key deactivated' })
      return
    }
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      reply.code(HTTP.FORBIDDEN).send({ error: 'API key expired' })
      return
    }
    if (
      requiredScope &&
      !record.scopes.includes('*') &&
      !record.scopes.includes(requiredScope)
    ) {
      reply.code(HTTP.FORBIDDEN).send({ error: 'Insufficient scope' })
      return
    }
    ;(request as RequestWithApiKey).apiKey = {
      keyId: record.id,
      name: record.name,
      scopes: record.scopes,
    }
  }
}
