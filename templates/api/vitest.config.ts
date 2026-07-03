import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Raised from the 10s default for the integration suites: each spins up an
    // in-process WASM Postgres (PGlite) and applies every migration in its
    // beforeAll. Compiling the Postgres WASM plus running the migrations is
    // legitimately several seconds, and with multiple integration files running
    // in parallel they contend for CPU, pushing setup past 10s. This is setup
    // cost, not a hang — the test bodies themselves are fast. Applies to hooks
    // only; per-test timeout stays at the default so a real hang still fails.
    hookTimeout: 60_000,
    // Silence request logging during tests: the app logs every injected
    // request, which buries test output. env.ts reads LOG_LEVEL at import
    // time, so setting it here (before test files load) is enough.
    env: {
      LOG_LEVEL: 'fatal',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Measure the whole product source, not just files that tests happen
      // to import — untested files must show up as 0%, not vanish.
      include: ['src/**'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        // Honest exclusion, bootstrap only: server.ts (ports, process
        // signals, process.exit) and index.ts (one-line entry) touch the
        // real process and cannot run under the test runner without faking
        // the process itself. Everything they wire together IS covered via
        // buildApp() injection tests. Do NOT add product code here.
        'src/server.ts',
        'src/index.ts',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
})
