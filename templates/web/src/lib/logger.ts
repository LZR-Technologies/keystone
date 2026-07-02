/* eslint-disable no-console */
// Why: this module is the app's central log sink. The global `no-console`
// rule forbids console.* in product code precisely to force the use of this
// logger — so this is the only place where console.debug/info/warn/error
// are allowed.

/**
 * Structured logger.
 *
 * Dev: colored console with timestamp and module
 * Prod: structured JSON for ingestion (Sentry/Datadog)
 *
 * Usage:
 *   import { createLogger } from '@/lib/logger';
 *   const log = createLogger('userService');
 *   log.info('User created', { userId: '123' });
 *   log.error('Failed to load', { error: err.message });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  module: string
  message: string
  data?: Record<string, unknown>
  timestamp: string
}

const isProd =
  typeof window !== 'undefined'
    ? window.location?.hostname !== 'localhost'
    : process.env.NODE_ENV === 'production'

function formatEntry(entry: LogEntry): string {
  if (isProd) {
    return JSON.stringify(entry)
  }
  // entry.timestamp is always produced by createLogger() below as
  // new Date().toISOString() (never externally supplied -- formatEntry and
  // this function are both module-private), which always contains 'T' and
  // always has time content after it. The ?. / ?? here is defensive against
  // that internal invariant changing, not a reachable branch today.
  /* v8 ignore next */
  const time = entry.timestamp.split('T')[1]?.slice(0, 8) ?? ''
  const prefix = `[${time}] [${entry.module}]`
  const data = entry.data ? ` ${JSON.stringify(entry.data)}` : ''
  return `${prefix} ${entry.message}${data}`
}

function emit(entry: LogEntry) {
  const formatted = formatEntry(entry)
  switch (entry.level) {
    case 'debug':
      console.debug(formatted)
      break
    case 'info':
      console.info(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'error':
      console.error(formatted)
      break
  }
}

export function createLogger(module: string) {
  const log = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
    emit({ level, module, message, data, timestamp: new Date().toISOString() })
  }

  return {
    debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data),
    info: (msg: string, data?: Record<string, unknown>) => log('info', msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log('warn', msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data),
  }
}
