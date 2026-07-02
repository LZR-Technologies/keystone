import { describe, it, expect, vi, afterEach } from 'vitest'

import { createLogger } from '../../lib/logger'

// This suite runs under the project's default jsdom environment, where
// `window` exists with hostname "localhost" -- so isProd is false here and
// the dev (human-readable) formatting branch is what gets exercised. The
// prod (JSON) branch and the `typeof window === 'undefined'` branch are
// covered separately in logger.node.test.ts, which forces a Node
// environment where no `window` global exists at all.
describe('createLogger (dev / jsdom formatting)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('formats a debug entry with the module name and message, then logs via console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const log = createLogger('test-module')

    log.debug('hello')

    expect(spy).toHaveBeenCalledTimes(1)
    const [line] = spy.mock.calls[0] as [string]
    expect(line).toContain('[test-module]')
    expect(line).toContain('hello')
  })

  it('routes info to console.info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    createLogger('m').info('info message')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('routes warn to console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createLogger('m').warn('warn message')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('routes error to console.error and includes structured data in the formatted line', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    createLogger('m').error('failed', { reason: 'boom' })

    expect(spy).toHaveBeenCalledTimes(1)
    const [line] = spy.mock.calls[0] as [string]
    expect(line).toContain('failed')
    expect(line).toContain('"reason":"boom"')
  })

  it('omits the trailing data block when no data is passed', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    createLogger('m').info('no data here')

    const [line] = spy.mock.calls[0] as [string]
    // No data object serialized means no "{" appears in the formatted line.
    expect(line).not.toContain('{')
  })
})
