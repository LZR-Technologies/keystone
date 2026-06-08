/* eslint-disable no-console */
// Why: este módulo é o sink central de logs do app. A regra global
// `no-console` proíbe console.* em código de produto justamente para
// forçar o uso deste logger — então aqui é o único lugar onde
// console.debug/info/warn/error são permitidos.

/**
 * Logger estruturado.
 *
 * Dev: console colorido com timestamp e módulo
 * Prod: JSON estruturado para ingestão (Sentry/Datadog)
 *
 * Uso:
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
