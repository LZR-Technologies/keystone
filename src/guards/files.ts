// Lists the source files a guard should inspect, skipping noise.

import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

// Build output, dependencies, and VCS metadata — never worth guarding. '.next' (Next.js),
// '.turbo', and 'coverage' join the list so scanning a real project does not trip over
// minified framework code (which legitimately uses innerHTML and the like).
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'docs',
  '.next',
  '.turbo',
  'coverage',
])
const ALWAYS_IGNORED = new Set(['node_modules', '.git', 'dist', '.next', '.turbo', 'coverage'])
// Generated lockfiles are machine output, not code to review — a linter/size guard has
// nothing to say about them, and flagging one is a false positive. Skip them everywhere.
const IGNORED_FILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'])
const SOURCE_EXTENSIONS = /\.(?:ts|tsx|js|jsx|json)$/

/** Walk a directory and return source files worth guarding (env files included). */
export async function listSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue
    if (IGNORED_FILES.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(full)))
    } else if (SOURCE_EXTENSIONS.test(entry.name) || entry.name.startsWith('.env')) {
      files.push(full)
    }
  }
  return files
}

/** Walk a directory and return every file (for analysis), skipping only heavy noise. */
export async function listAllFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    if (ALWAYS_IGNORED.has(entry.name)) continue
    if (IGNORED_FILES.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listAllFiles(full)))
    } else {
      files.push(full)
    }
  }
  return files
}
