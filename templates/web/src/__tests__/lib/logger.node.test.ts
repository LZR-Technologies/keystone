// @vitest-environment node
//
// Forces plain Node (no `window` global at all), the opposite of the
// project-wide jsdom environment. logger.ts branches on
// `typeof window !== 'undefined'` to decide dev-vs-prod formatting; jsdom
// always provides a `window`, so that branch's "undefined" side (and the
// prod JSON-formatting path it feeds) is only reachable from a real Node
// environment. See logger.test.ts for the jsdom/dev-format coverage.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

describe('createLogger (prod / no-window formatting)', () => {
  beforeEach(() => {
    // logger.ts computes isProd ONCE at module load from
    // process.env.NODE_ENV, so each test needs its own fresh module
    // instance -- vi.resetModules() clears vitest's module cache before the
    // dynamic import below re-evaluates logger.ts under the env set here.
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('emits structured JSON when NODE_ENV is production and there is no window', async () => {
    // vi.stubEnv (not a direct process.env.NODE_ENV assignment): recent
    // @types/node marks NODE_ENV readonly, so this is also the
    // type-checked way to override it for a single test.
    vi.stubEnv('NODE_ENV', 'production')
    const { createLogger } = await import('../../lib/logger')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

    createLogger('svc').info('started', { port: 3000 })

    expect(spy).toHaveBeenCalledTimes(1)
    const [line] = spy.mock.calls[0] as [string]
    const parsed = JSON.parse(line) as {
      level: string
      module: string
      message: string
      data?: Record<string, unknown>
    }
    expect(parsed).toMatchObject({ level: 'info', module: 'svc', message: 'started' })
    expect(parsed.data).toEqual({ port: 3000 })
  })

  it('falls back to human-readable formatting when NODE_ENV is not production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { createLogger } = await import('../../lib/logger')
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    createLogger('svc').debug('tick')

    const [line] = spy.mock.calls[0] as [string]
    // Prod format is a single JSON object; dev format is not valid JSON
    // (it is a "[time] [module] message" string), which is the cleanest way
    // to prove the two branches produce genuinely different shapes.
    expect(() => JSON.parse(line)).toThrow()
    expect(line).toContain('[svc]')
  })

  it('emits structured JSON when window exists but its hostname is not "localhost"', async () => {
    // Stubs a minimal fake `window` global (this test file runs in the
    // plain Node environment, so no real `window` exists to mutate) --
    // reaches the OTHER half of logger.ts's `typeof window !== 'undefined'`
    // ternary: window present, but hostname !== 'localhost'. logger.test.ts
    // covers hostname === 'localhost' (real jsdom, dev format); this test
    // and "no window at all" above cover the remaining two isProd sources.
    vi.stubGlobal('window', { location: { hostname: 'app.example.com' } })
    const { createLogger } = await import('../../lib/logger')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

    createLogger('svc').info('started')

    const [line] = spy.mock.calls[0] as [string]
    expect(() => JSON.parse(line)).not.toThrow()
  })
})
