import { fileURLToPath } from 'node:url'

import { defineConfig, configDefaults } from 'vitest/config'

/**
 * Vitest config.
 *
 * Playwright E2E lives in e2e/ and runs separately (pnpm test:e2e). Without
 * excluding it here, Vitest tries to interpret specs using Playwright's
 * test.describe (incompatible) and breaks `pnpm test`.
 */
export default defineConfig({
  // tsconfig sets "jsx": "preserve" because Next's own compiler owns the JSX
  // transform in the app build. Vitest runs on Vite/esbuild instead, which
  // has no such downstream step, so it needs an explicit transform here --
  // "automatic" auto-imports the JSX runtime instead of requiring `import
  // React` in every test file.
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      // Mirrors the "@/*" -> "./src/*" path mapping in tsconfig.json.
      // TypeScript's `paths` is a type-checker-only construct -- it does not
      // rewrite imports at runtime, so Vite (which Vitest runs on) needs its
      // own alias or every "@/..." import fails to resolve during tests.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // jsdom: hook tests (e.g. use-items.test.ts) render through
    // @testing-library/react's renderHook, which mounts via react-dom/client
    // and needs a `document` -- plain Node has none. Pure business-rule
    // tests (archive-policy.test.ts) do not need it, but a single global
    // environment is simpler than annotating files individually, and jsdom
    // has no meaningful runtime cost for logic-only tests.
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Registers RTL's cleanup(afterEach) -- see vitest.setup.ts for why this
    // cannot rely on RTL's own auto-registration in this project.
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      // v8 reads coverage straight from Node's built-in instrumentation --
      // no source transformation step, so it stays accurate for TypeScript
      // without a separate Istanbul-instrumented build.
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Scoped to the app's actual logic surface: business rules, hooks,
      // utilities, the query registry, route handlers, and any component
      // that renders a decision (not just static markup). Framework
      // bootstrap glue is excluded below, by name, with its own comment --
      // never by broadly excluding a whole directory "to be safe".
      include: [
        'src/lib/**',
        'src/features/**',
        'src/hooks/**',
        'src/utils/**',
        'src/app/api/**',
        'src/components/**',
      ],
      exclude: [
        ...(configDefaults.coverage.exclude ?? []),
        'e2e/**',
        // Type-only modules: erased at compile time, so v8's runtime
        // instrumentation has nothing to record and would report a
        // permanent false 0%, skewing the aggregate.
        'src/lib/types.ts',
        'src/types/**',
      ],
      // 100%: every included file is exercised on every line, branch,
      // function, and statement. The only files excluded from the
      // denominator are genuinely untestable framework glue / pure
      // presentation / bootstrap (src/app/layout.tsx, src/app/page.tsx,
      // src/app/providers.tsx -- excluded from `include` above, not listed
      // under `exclude`, because they sit outside the included directories
      // entirely) and type-only modules. Everything that ships inside the
      // included directories -- hooks, features, api routes, the in-memory
      // store, query-keys/config/invalidation, utilities, and any component
      // with logic -- is tested to 100%, no broad carve-outs.
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100,
      },
    },
  },
})
