import { afterEach, describe, expect, it, vi } from 'vitest'

// logger.ts builds its pino instance from `env` at module-evaluation time
// (see src/config/env.ts), so the only way to observe both branches of its
// `env.NODE_ENV === 'development'` transport ternary is to mock the env
// module's value and re-import logger.ts fresh per case.
//
// The transport itself is asserted by inspecting the options object passed
// to `pino()` (mocking pino, not env's downstream effect on it) rather than
// pino's internal stream machinery: pino-pretty spawns a real worker thread
// when actually constructed, which is slow, resource-heavy, and asserts
// nothing pino doesn't already guarantee itself. What THIS file owns and
// must prove is which `transport` value logger.ts passes for each NODE_ENV —
// that boundary is exactly the ternary's job.
const pinoMock = vi.fn(() => ({ info: vi.fn() }))
vi.mock('pino', () => ({
  default: Object.assign(pinoMock, {
    stdTimeFunctions: { isoTime: 'iso-time-fn' },
    stdSerializers: { err: 'err-serializer-fn' },
  }),
}))

describe('logger', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('wires the pino-pretty transport in development', async () => {
    vi.doMock('../env.js', () => ({ env: { LOG_LEVEL: 'fatal', NODE_ENV: 'development' } }))
    vi.resetModules()

    await import('../logger.js')

    expect(pinoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    )
  })

  it('omits the transport (plain JSON to stdout) outside development', async () => {
    vi.doMock('../env.js', () => ({ env: { LOG_LEVEL: 'fatal', NODE_ENV: 'production' } }))
    vi.resetModules()

    await import('../logger.js')

    expect(pinoMock).toHaveBeenCalledWith(expect.objectContaining({ transport: undefined }))
  })
})
