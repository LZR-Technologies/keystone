import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * Registers React Testing Library's DOM cleanup after every test.
 *
 * RTL auto-registers this itself, but ONLY when it finds a global
 * `afterEach` function (see its index.js). This project imports test
 * globals explicitly from "vitest" (test.globals is not enabled in
 * vitest.config.ts) rather than relying on injected globals, so RTL's
 * auto-detection never fires and `render()` output from one test silently
 * leaks into the next -- a real bug that surfaced as a passing individual
 * test failing only when run alongside its siblings. Importing `afterEach`
 * here, at module scope, and calling `cleanup()` explicitly closes that gap
 * for every test file without switching the whole project to
 * `test.globals: true`.
 */
afterEach(() => {
  cleanup()
})
