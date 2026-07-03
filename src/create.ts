// Creating a project: copy the real template (web or api) into place, then adjust the
// few variable points — the package name, and the dotfiles npm strips on publish. The
// project is the actual template, only renamed and with its stripped dotfiles restored.
// See docs/build-plan.md and docs/commands.md.

import { cp, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { KeystoneAnswers, ProjectType } from './types.ts'

// Keystone's own installation root — one level up from this module (src/ in the repo, or
// dist/ in the published package). Both the templates and the tool's package.json live here.
const KEYSTONE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES_DIR = join(KEYSTONE_ROOT, 'templates')

/**
 * Read Keystone's own version from its package.json instead of hardcoding it. A hardcoded
 * '0.1.0' duplicates the manifest and silently goes stale on the first version bump; reading
 * it keeps keystone.json truthful about which tool version created the project. Falls back to
 * 'unknown' rather than crash creation if the manifest is somehow unreadable — the record is
 * informational, never worth failing a scaffold over.
 */
async function readKeystoneVersion(): Promise<string> {
  try {
    const raw = await readFile(join(KEYSTONE_ROOT, 'package.json'), 'utf8')
    const parsed = JSON.parse(raw) as { version?: string }
    return parsed.version ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

// Layer B — the agent harness. Stack-agnostic (reviewers, guardrails, the spec workflow,
// layered context), so it lives once and is copied on top of every template rather than
// duplicated inside each one.
const HARNESS_DIR = join(TEMPLATES_DIR, 'agent-harness')

/** Which template serves each project type. Mobile has no template yet. */
const TEMPLATE_BY_TYPE: Record<ProjectType, 'web' | 'api' | null> = {
  site: 'web',
  system: 'web',
  service: 'api',
  mobile: null,
}

/**
 * Whether a template exists for a project type. Exposed so the wizard can warn the moment a
 * template-less type (mobile) is chosen, instead of after the whole briefing — a single source
 * of truth for "is this type supported", shared with createProject's own check.
 */
export function TEMPLATE_EXISTS_FOR(type: ProjectType): boolean {
  return TEMPLATE_BY_TYPE[type] !== null
}

// The name is written verbatim into the project's package.json "name" field, so it must be a
// valid npm package name — otherwise the generated project is born with a manifest npm rejects
// (e.g. `keystone new "My App"` would write `"name": "My App"`, invalid: space + uppercase).
// This is the npm rule set, trimmed to what a fresh unscoped project needs: all lowercase, no
// spaces, only URL-safe name characters, not starting with a dot or underscore, within npm's
// 214-char limit. We validate the name EARLY (before creating anything) so a bad name is a clear
// up-front error, never a half-scaffolded folder. See docs/setup-wizard.md.
const VALID_PACKAGE_NAME = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/
const MAX_PACKAGE_NAME_LENGTH = 214

/** Throw a clear, human error when a project name would produce an invalid npm manifest. */
export function assertValidProjectName(name: string): void {
  if (name.length === 0 || name.length > MAX_PACKAGE_NAME_LENGTH) {
    throw new Error(
      `Invalid project name "${name}": must be 1–${MAX_PACKAGE_NAME_LENGTH} characters.`,
    )
  }
  if (!VALID_PACKAGE_NAME.test(name)) {
    throw new Error(
      `Invalid project name "${name}": use lowercase letters, numbers, and - . _ only ` +
        `(no spaces or uppercase), and start/end with a letter or number. ` +
        `Example: "my-app". See docs/setup-wizard.md.`,
    )
  }
}

export interface DeducedChoices {
  needsDatabase: boolean
  securityLevel: 'essential' | 'reinforced'
}

/**
 * Decide what Keystone can figure out from what the user already said —
 * never asked. Recorded in keystone.json so the choice is visible.
 * See docs/setup-wizard.md ("type 2" decisions) and docs/database.md.
 */
export function deduce(answers: KeystoneAnswers): DeducedChoices {
  const { type, sensitive } = answers.product
  const dataBackedTypes: ProjectType[] = ['system', 'service']
  const needsDatabase = dataBackedTypes.includes(type) || (type === 'mobile' && sensitive)
  return {
    needsDatabase,
    securityLevel: sensitive ? 'reinforced' : 'essential',
  }
}

export interface CreateResult {
  projectDir: string
  template: 'web' | 'api'
  deduced: DeducedChoices
}

// Directories that are dependencies, build output, or VCS metadata — never copied into a
// new project, even if a stray local build left them in the template. Keeps a generated
// project clean and small.
const NON_COPYABLE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', '.turbo', 'coverage'])

// Loose build artifacts matched by file name: the TypeScript incremental-build cache
// (*.tsbuildinfo) is per-machine state from whoever last built the template — copying
// it would hand every generated project a stale cache from another project.
const NON_COPYABLE_FILES = /\.tsbuildinfo$/

/**
 * Build a copy filter that skips the non-copyable directories INSIDE a template, judged by
 * the path relative to the template root — never the absolute path. This matters when
 * Keystone itself is installed: the template then lives under `.../node_modules/keystone/
 * templates/...`, so an absolute-path check would see "node_modules" in every path and
 * copy nothing. Relative to the template root, only a real nested build/deps dir is skipped.
 */
export function copyFilterFor(sourceRoot: string): (source: string) => boolean {
  // Node 20 on Windows hands the filter extended-length paths (\\?\C:\...) while the source
  // root carries none; path.relative can't reconcile the two prefixes and returns an absolute
  // path, so the node_modules check below would match Keystone's own install location and copy
  // nothing — the concrete cause of the "created an empty folder" bug on the minimum supported
  // runtime. Strip the prefix from both sides first. Node 22+ never adds it, so this is a no-op there.
  const stripLongPrefix = (p: string) => p.replace(/^\\\\\?\\/, '')
  const root = stripLongPrefix(sourceRoot)
  return (source: string) => {
    const rel = relative(root, stripLongPrefix(source))
    const segments = rel.split(/[\\/]/)
    if (segments.some((segment) => NON_COPYABLE_DIRS.has(segment))) return false
    const last = segments[segments.length - 1] ?? ''
    return !NON_COPYABLE_FILES.test(last)
  }
}

/** Dotfiles npm strips from a package, mapped from their shipped name to their real name. */
const DOTFILES_TO_RESTORE: Record<string, string> = { gitignore: '.gitignore' }

/** Throw a clear error if the destination exists and is not empty — never overwrite. */
async function assertEmptyDestination(projectDir: string): Promise<void> {
  try {
    const entries = await readdir(projectDir)
    if (entries.length > 0) {
      throw new Error(
        `Destination "${projectDir}" already exists and is not empty. ` +
          `Choose a different name or remove the folder first.`,
      )
    }
  } catch (error) {
    // ENOENT means the folder does not exist yet — the good case. Re-throw anything else.
    if ((error as { code?: string }).code !== 'ENOENT') throw error
  }
}

/** Rename shipped dotfiles (e.g. `gitignore` -> `.gitignore`) inside the new project. */
async function restoreDotfiles(projectDir: string): Promise<void> {
  for (const [shipped, real] of Object.entries(DOTFILES_TO_RESTORE)) {
    const from = join(projectDir, shipped)
    try {
      await rename(from, join(projectDir, real))
    } catch (error) {
      // A template without that dotfile is fine — nothing to restore.
      if ((error as { code?: string }).code !== 'ENOENT') throw error
    }
  }
}

/** Create the project by copying the real template and renaming it. */
export async function createProject(answers: KeystoneAnswers): Promise<CreateResult> {
  // Validate the name first, before any filesystem work: a bad name must fail up front,
  // never after a folder has been created. This is the last line of defense even when the
  // wizard already checked, so a non-interactive caller (a preset name) is guarded too.
  assertValidProjectName(answers.product.name)

  const template = TEMPLATE_BY_TYPE[answers.product.type]
  if (!template) {
    throw new Error(
      `No template yet for project type "${answers.product.type}" — only site/system/service.`,
    )
  }

  const deduced = deduce(answers)
  const projectDir = resolve(answers.setup.parentDir, answers.product.name)
  const source = join(TEMPLATES_DIR, template)

  // Refuse a non-empty destination. Without this, scaffolding over an existing folder
  // silently overwrites the user's files (a typo'd name = data loss) and still exits 0.
  // A missing folder is fine — cp creates it.
  await assertEmptyDestination(projectDir)

  // Copy the actual template, skipping installed dependencies. The filter is anchored to
  // each source root so it works whether Keystone runs from the repo or from an install
  // under node_modules.
  await cp(source, projectDir, { recursive: true, filter: copyFilterFor(source) })

  // Layer B — lay the agent harness on top of the template, so every project starts with
  // its reviewers, guardrails, spec workflow, layered context, session continuity, and
  // long-term memory. Copied after the template (adds only new trees: .claude/, specs/,
  // memory/, knowledge/, and docs/agent-harness.md — never overwrites a template file).
  await cp(HARNESS_DIR, projectDir, { recursive: true, filter: copyFilterFor(HARNESS_DIR) })

  // Restore the dotfiles that npm strips from a published package. npm refuses to ship a
  // file literally named `.gitignore`, so templates carry it as `gitignore` (no dot) and
  // we rename it back here — otherwise a project created from the INSTALLED package would
  // be born with no .gitignore, and its first `git add -A` would swallow node_modules and
  // even commit a .env. (From the repo the file is already `gitignore` too, kept uniform.)
  await restoreDotfiles(projectDir)

  // Change only the name, by text substitution, so the rest of the manifest
  // keeps the template's exact formatting (no JSON reflow).
  const pkgPath = join(projectDir, 'package.json')
  const manifest = await readFile(pkgPath, 'utf8')
  const renamed = manifest.replace(
    /("name"\s*:\s*)"[^"]*"/,
    (_match, prefix: string) => `${prefix}"${answers.product.name}"`,
  )
  await writeFile(pkgPath, renamed)

  // Record how this project was created, next to the template it came from. The product
  // answers (language, screen priority, look) are stored here as recorded intent for a later
  // step to act on — creation itself does not apply them — so the file is an honest log of
  // what the user chose, not a claim that each choice was provisioned.
  const record = {
    // Read from the tool's own package.json so this never drifts from the real version.
    keystoneVersion: await readKeystoneVersion(),
    template,
    product: answers.product,
    setup: answers.setup,
    deduced,
  }
  await writeFile(join(projectDir, 'keystone.json'), `${JSON.stringify(record, null, 2)}\n`)

  return { projectDir, template, deduced }
}
