// The project gates: the blocking checks that run a project's own tooling and fail when it
// fails. The text guards (src/guards) read files; these gates instead RUN the project's
// checks — formatter, linter, type-checker, tests — plus a dependency-vulnerability
// audit. Together they are the pre-ship gate the pillars call for (docs/code-quality.md
// item 2, docs/tests.md item 3, docs/security.md item 1.6).
//
// Every gate shells out through the injected CommandRunner (see ../exec.ts), so the
// whole set is testable without running any real tool. A gate whose script the project
// does not define is skipped, not failed — Keystone reports what it could not run rather
// than pretending it passed.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CommandRunner } from '../exec.ts'
import { detectPackageManager, type PackageManager } from '../post-create.ts'

export type GateStatus = 'passed' | 'failed' | 'skipped'

export interface GateResult {
  name: string
  pillar: string
  status: GateStatus
  /** Why it failed or was skipped; empty when it passed. */
  detail: string
}

/** A gate either runs a command, or reports why it was skipped. */
type GatePlan = { run: { command: string; args: string[] } } | { skip: string }

/** What a gate needs to decide whether and how to run. */
interface GateContext {
  scripts: Record<string, string>
  pm: PackageManager
  /** Whether the directory is actually a project (has a readable package.json). */
  hasManifest: boolean
}

interface GateSpec {
  name: string
  pillar: string
  plan(ctx: GateContext): GatePlan
}

/** A gate backed by an npm script: runs `<pm> run <script>`, or skips if the project has no such script. */
function scriptGate(name: string, pillar: string, script: string): GateSpec {
  return {
    name,
    pillar,
    plan({ scripts, pm }) {
      if (!scripts[script]) {
        return { skip: `no "${script}" script in package.json` }
      }
      return { run: { command: pm, args: ['run', script] } }
    },
  }
}

// The order is cheapest-and-most-fundamental first: formatting and types are fast and
// catch the most, tests are slower, the audit reaches the network. All still run — the
// order is only about which failure the user sees at the top.
const GATES: GateSpec[] = [
  scriptGate('formatting', 'Code quality', 'format:check'),
  scriptGate('lint (errors & warnings)', 'Code quality', 'lint'),
  scriptGate('types', 'Code quality', 'typecheck'),
  {
    // Prefer "test:coverage" over "test" when the project defines it. Running plain "test"
    // gives a green seal to a project whose coverage threshold is violated — the coverage
    // script is the one that actually enforces the tests pillar (docs/tests.md item 3). Fall
    // back to "test" when there is no coverage script, and skip only when neither exists.
    name: 'tests',
    pillar: 'Tests',
    plan({ scripts, pm }) {
      const script = scripts['test:coverage'] ? 'test:coverage' : scripts['test'] ? 'test' : null
      if (!script) {
        return { skip: 'no "test" or "test:coverage" script in package.json' }
      }
      return { run: { command: pm, args: ['run', script] } }
    },
  },
  {
    // Not a project script — the package manager's own audit of the dependency list.
    name: 'dependency audit',
    pillar: 'Security',
    plan({ pm, hasManifest }) {
      // Skip when the directory is not a project: a bare folder makes `npm audit` report
      // "0 vulnerabilities" and the gate would stamp a green security pass on a non-project.
      if (!hasManifest) return { skip: 'no package.json — not a project' }
      return { run: { command: pm, args: ['audit'] } }
    },
  },
]

interface ProjectManifest {
  scripts: Record<string, string>
  /** False when the directory has no readable package.json — i.e. it is not a project. */
  hasManifest: boolean
}

/** Read the project's package.json scripts; a missing or unreadable manifest means "no scripts". */
async function readManifest(dir: string): Promise<ProjectManifest> {
  try {
    const raw = await readFile(join(dir, 'package.json'), 'utf8')
    const parsed = JSON.parse(raw) as { scripts?: Record<string, string> }
    return { scripts: parsed.scripts ?? {}, hasManifest: true }
  } catch {
    // No manifest, or malformed: every script-based gate skips, and the audit skips too.
    return { scripts: {}, hasManifest: false }
  }
}

/**
 * The first meaningful line of tool output — enough to point at the failure without a
 * wall of text. npm/pnpm echo the script as "> name" / "> command" before the real
 * output, so those banner lines are skipped: the detail should show the actual error,
 * not the runner announcing itself. Falls back to the first non-empty line if all of
 * them are banners.
 */
function firstLine(output: string): string {
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
  return lines.find((line) => !line.startsWith('>')) ?? lines[0] ?? ''
}

/**
 * Run every project gate over a directory and return one result each. Deterministic and
 * AI-free: it only runs the project's existing tools. Never throws on a failing tool —
 * a failure is a `failed` result, which is the gate doing its job.
 */
export async function runProjectGates(dir: string, runner: CommandRunner): Promise<GateResult[]> {
  const { scripts, hasManifest } = await readManifest(dir)
  const pm = await detectPackageManager(dir)

  const results: GateResult[] = []
  for (const gate of GATES) {
    const plan = gate.plan({ scripts, pm, hasManifest })
    if ('skip' in plan) {
      results.push({ name: gate.name, pillar: gate.pillar, status: 'skipped', detail: plan.skip })
      continue
    }
    const result = await runner.run(plan.run.command, plan.run.args, dir)
    results.push({
      name: gate.name,
      pillar: gate.pillar,
      status: result.ok ? 'passed' : 'failed',
      detail: result.ok ? '' : firstLine(result.output),
    })
  }
  return results
}

/** True when any gate actually failed (skips are not failures — they simply did not run). */
export function anyGateFailed(results: GateResult[]): boolean {
  return results.some((r) => r.status === 'failed')
}
