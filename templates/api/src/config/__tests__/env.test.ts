import { afterEach, describe, expect, it, vi } from 'vitest'

import { parseEnv } from '../env.js'

describe('parseEnv', () => {
  it('applies safe defaults when optional variables are absent', () => {
    const result = parseEnv({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development')
      expect(result.data.PORT).toBe(3000)
      expect(result.data.HOST).toBe('0.0.0.0')
      expect(result.data.LOG_LEVEL).toBe('info')
    }
  })

  it('coerces PORT from the string the shell provides', () => {
    const result = parseEnv({ PORT: '8080' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.PORT).toBe(8080)
    }
  })

  it('fails with the offending field named when a value is invalid', () => {
    const result = parseEnv({ NODE_ENV: 'staging' })

    expect(result.success).toBe(false)
    if (!result.success) {
      // The operator fixing a broken deploy must see WHICH variable is wrong.
      expect(result.error).toContain('NODE_ENV')
    }
  })

  it('rejects a malformed DATABASE_URL instead of failing later at connect time', () => {
    const result = parseEnv({ DATABASE_URL: 'not-a-url' })

    expect(result.success).toBe(false)
  })
})

describe('env (module-load-time singleton)', () => {
  const ORIGINAL_ENV = { ...process.env }

  afterEach(() => {
    // Every test in this block mutates process.env and re-imports the
    // module; restore both so later test files see the real environment
    // and the real (already-loaded) env singleton, not a stale mock.
    process.env = { ...ORIGINAL_ENV }
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('exports a parsed env built from the real process.env on import', async () => {
    process.env = { ...ORIGINAL_ENV, PORT: '4321' }
    vi.resetModules()

    // Dynamic import after resetModules: env.ts runs loadEnv() at its own
    // module-evaluation time, so this is the only way to observe it with a
    // controlled process.env instead of whatever was set before this file ran.
    const { env } = await import('../env.js')

    expect(env.PORT).toBe(4321)
  })

  it('writes the field error to stderr and exits the process when the environment is invalid', async () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'not-a-real-environment' }
    vi.resetModules()

    const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    // process.exit(1) must not actually kill the test worker. Throwing from
    // the mock stops loadEnv() at the same point real process.exit would
    // (nothing after it in the function runs), which is what the assertion
    // below on the export itself is set up to expect a rejection for.
    const processExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit was called')
    })

    await expect(import('../env.js')).rejects.toThrow('process.exit was called')

    expect(stderrWrite).toHaveBeenCalledWith(expect.stringContaining('NODE_ENV'))
    expect(processExit).toHaveBeenCalledWith(1)
  })
})
