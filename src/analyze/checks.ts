// The deterministic part of analyzing an existing project: measure it against
// the pillars with no AI, zero cost. The deeper judgement (severity nuance, the
// full upgrade plan) is left to the assistant the dev already uses.
// The command only reads — it never changes the project. See docs/analyze.md.

import { readFile } from 'node:fs/promises'
import { basename, relative, sep } from 'node:path'
import { listAllFiles } from '../guards/files.ts'
import { scanSecrets } from '../guards/secrets.ts'
import { scanSize } from '../guards/size.ts'

export type Severity = 'high' | 'medium' | 'low'
export type Effort = 'small' | 'medium' | 'large'
export type Risk = 'low' | 'medium' | 'high'

export interface CheckResult {
  pillar: string
  title: string
  passed: boolean
  /**
   * True when the check does not apply to this project (e.g. no database present), so the
   * report can show a neutral "not applicable" instead of a green ✓. A not-applicable check
   * is not counted as a real pass — displaying it as an approval would overstate what was
   * actually verified. See docs/analyze.md.
   */
  notApplicable?: boolean
  /**
   * True when a check PASSES but its detail carries a caveat the reader must see (e.g. the database
   * conventions pass, but the schema is single-owner and has no tenant isolation). A plain pass
   * hides its detail; a caveated pass shows it, so an honest "✓ … but note X" never collapses into
   * a bare "✓" the reader could over-read. Still a real pass — it is not a failure. See docs/analyze.md.
   */
  caveat?: boolean
  severity: Severity
  effort: Effort
  risk: Risk
  detail: string
}

export interface Snapshot {
  /** All file paths, relative and normalized with '/'. */
  paths: string[]
  /** Source/text files with their content, for content checks. */
  files: { path: string; content: string }[]
}

type Check = (snapshot: Snapshot) => CheckResult

const checkSecrets: Check = (s) => {
  const findings = s.files.flatMap((f) => scanSecrets(f.path, f.content))
  return {
    pillar: 'Security',
    title: 'No exposed secrets',
    passed: findings.length === 0,
    severity: 'high',
    effort: 'small',
    risk: 'low',
    detail: findings.length ? `${findings.length} possible secret(s)` : 'clean',
  }
}

const checkGitignore: Check = (s) => {
  const gitignore = s.files.find((f) => f.path === '.gitignore')
  const passed = !!gitignore && /\.env/.test(gitignore.content)
  return {
    pillar: 'Security',
    title: 'Secrets kept out of the code (.env ignored)',
    passed,
    severity: 'medium',
    effort: 'small',
    risk: 'low',
    detail: passed ? 'ok' : 'no .gitignore rule for .env',
  }
}

const checkTests: Check = (s) => {
  // Require an actual test FILE, not merely a tests/ folder. A bare tests/README.md used
  // to satisfy this (the folder matched), so a project with every test deleted still
  // passed — a hollow green. Match named test/spec files and e2e specs instead.
  const hasTests = s.paths.some((p) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(p))
  return {
    pillar: 'Tests',
    title: 'Has tests',
    passed: hasTests,
    severity: 'high',
    effort: 'large',
    risk: 'low',
    detail: hasTests ? 'found' : 'no test files found',
  }
}

const checkReadme: Check = (s) => {
  const hasReadme = s.paths.some((p) => /^readme\.md$/i.test(p))
  return {
    pillar: 'Documentation',
    title: 'Has a README',
    passed: hasReadme,
    severity: 'low',
    effort: 'small',
    risk: 'low',
    detail: hasReadme ? 'found' : 'no README.md at the root',
  }
}

const checkDatabaseConventions: Check = (s) => {
  const sqlFiles = s.files.filter((f) => f.path.endsWith('.sql'))
  if (sqlFiles.length === 0) {
    // No database to check. Mark this not-applicable rather than a pass: a project with no
    // SQL was never verified against the data conventions, so showing a green ✓ would imply
    // an approval that never happened. passed stays true only so it is not listed as a
    // FAILURE in the upgrade plan; notApplicable drives the neutral display.
    return {
      pillar: 'Database',
      title: 'Database conventions',
      passed: true,
      notApplicable: true,
      severity: 'low',
      effort: 'small',
      risk: 'low',
      detail: 'no database detected — not applicable',
    }
  }
  // Strip SQL comments before matching so a convention word only counts when it is real schema,
  // not prose. Without this, the single-owner variant — whose comments MENTION tenant_id to explain
  // its deliberate absence — would score a green tenant-isolation pass on a schema that has none: a
  // seal that lies. Remove line comments (`-- ...` to end of line) and block comments (`/* ... */`).
  const stripSqlComments = (sql: string): string =>
    sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ')
  const text = sqlFiles.map((f) => stripSqlComments(f.content)).join('\n')

  // Tenant isolation (tenant_id) is treated apart from the other three. Multi-tenancy is a valid
  // product CHOICE, not a universal requirement — a single-owner schema deliberately has no
  // tenant_id. So its absence must NOT read as a failure (that would punish a legitimate choice),
  // and its comment-only mention must NOT read as present (that would claim isolation a single-owner
  // schema does not have). The other three are true universal conventions: unguessable ids (uuid),
  // timestamps (created_at), soft delete (deleted_at) — any of these missing is a real gap.
  const coreConventions = ['uuid', 'created_at', 'deleted_at']
  const missingCore = coreConventions.filter((c) => !text.includes(c))
  const hasTenantIsolation = text.includes('tenant_id')

  // The check passes on the core three alone; tenant isolation never fails it. When the core passes
  // but there is no tenant_id, we say so in plain words ("single-owner schema — no tenant isolation")
  // so a reader NEVER concludes isolation exists here, and NEVER concludes the project is wrong for
  // being single-owner. When tenant_id IS present, the schema is multi-tenant and we say all present.
  const passed = missingCore.length === 0
  // A single-owner pass (core present, no real tenant_id) is a genuine pass WITH a caveat: the
  // reader must be told there is no tenant isolation, so the report surfaces this detail instead of
  // hiding it behind a bare ✓. A multi-tenant pass and any failure need no such flag.
  const singleOwnerPass = passed && !hasTenantIsolation
  const detail = missingCore.length
    ? `missing: ${missingCore.join(', ')}`
    : hasTenantIsolation
      ? 'all present, including tenant isolation'
      : 'core conventions present; single-owner schema — no tenant isolation'
  return {
    pillar: 'Database',
    title: 'Database follows the core conventions',
    passed,
    caveat: singleOwnerPass,
    severity: 'high',
    effort: 'medium',
    risk: 'medium',
    detail,
  }
}

const checkSize: Check = (s) => {
  const findings = s.files.flatMap((f) => scanSize(f.path, f.content))
  return {
    pillar: 'Code quality',
    title: 'No oversized files',
    passed: findings.length === 0,
    severity: 'low',
    effort: 'medium',
    risk: 'low',
    detail: findings.length ? `${findings.length} oversized file(s)` : 'ok',
  }
}

const CHECKS: Check[] = [
  checkSecrets,
  checkGitignore,
  checkTests,
  checkReadme,
  checkDatabaseConventions,
  checkSize,
]

/** Run all checks against a snapshot. Pure and deterministic — easy to test. */
export function runChecks(snapshot: Snapshot): CheckResult[] {
  return CHECKS.map((check) => check(snapshot))
}

const TEXT_FILE = /\.(?:ts|tsx|js|jsx|json|sql|md)$/

/** Read a project directory into a snapshot (only reads — never changes it). */
export async function snapshotOf(dir: string): Promise<Snapshot> {
  const absolute = await listAllFiles(dir)
  const toRel = (f: string): string => relative(dir, f).split(sep).join('/')
  const paths = absolute.map(toRel)

  const textFiles = absolute.filter(
    (f) => TEXT_FILE.test(f) || basename(f).startsWith('.env') || basename(f) === '.gitignore',
  )
  const files = await Promise.all(
    textFiles.map(async (f) => ({ path: toRel(f), content: await readFile(f, 'utf8') })),
  )
  return { paths, files }
}

/** Analyze a project directory and return the per-pillar results. */
export async function analyzeProject(dir: string): Promise<CheckResult[]> {
  return runChecks(await snapshotOf(dir))
}
