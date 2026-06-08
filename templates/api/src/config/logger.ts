import pino from 'pino'

import { env } from './env.js'

/**
 * Logger estruturado — JSON em produção, pretty em dev.
 * Handbook: "Structured JSON logging obrigatório"
 *
 * Formato:
 * {
 *   "timestamp": "...",
 *   "level": "error",
 *   "message": "...",
 *   "service": "api",
 *   "trace_id": "..."
 * }
 *
 * NUNCA logar: passwords, tokens, CPF/CNPJ completo, dados de cartão.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: {
    service: 'api',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
  },
})
