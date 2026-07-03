import { z } from 'zod'

import { ok, fail } from '../shared/types/result.js'

import type { Result } from '../shared/types/result.js'

const DEFAULT_PORT = 3000

/**
 * Environment variable validation schema.
 * Rule: no hardcoded values — everything via env vars.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(DEFAULT_PORT),
  // Default 0.0.0.0 = listen on ALL network interfaces. This is deliberate for
  // the primary target: inside a container or a cloud runtime the process must
  // accept connections from the orchestrator/load balancer, which reach it on
  // an interface other than loopback — binding to 127.0.0.1 there makes the
  // service unreachable. It is a security-relevant choice (the port is exposed
  // to whatever network the host sits on), so on a local machine the owner
  // should override HOST=127.0.0.1 to keep the service private to that machine.
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DATABASE_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Parses an environment source against the schema.
 *
 * Decision: a pure function taking the source as a parameter (instead of
 * reading process.env directly) so the failure path is unit-testable without
 * mutating the real process environment. The parameter is a plain record
 * (not NodeJS.ProcessEnv) to keep this file free of ambient namespaces.
 */
export function parseEnv(source: Record<string, string | undefined>): Result<Env, string> {
  const result = envSchema.safeParse(source)

  if (!result.success) {
    return fail(JSON.stringify(result.error.flatten().fieldErrors))
  }

  return ok(result.data)
}

function loadEnv(): Env {
  const result = parseEnv(process.env)

  if (!result.success) {
    // Plain text straight to stderr: the logger does not exist yet at this
    // point (it depends on env itself), and a config error must be readable
    // in raw container/CI output.
    process.stderr.write(`Invalid environment variables: ${result.error}\n`)
    process.exit(1)
  }

  return result.data
}

export const env = loadEnv()
