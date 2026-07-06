// After the template is copied into place, the create command can take the project
// the last mile: start version control, install dependencies, and — through that
// install — switch on the git hooks that ship inside the template. This module decides
// and orders those steps; the actual execution goes through an injected CommandRunner
// (see exec.ts) so the flow is testable without running git or a package manager.
//
// See docs/commands.md Step 4 ("Repository" / "Automatic checks") for the behavior
// contract this module implements.

import { access } from 'node:fs/promises'
import { join } from 'node:path'
import type { CommandRunner, CommandResult } from './exec.ts'

/** The package managers a template can declare, in the order we detect them. */
export type PackageManager = 'pnpm' | 'npm' | 'yarn'

/** Which lockfile proves which manager. Lockfile beats guessing — it is what the template was built with. */
const LOCKFILE_BY_MANAGER: Record<PackageManager, string> = {
  pnpm: 'pnpm-lock.yaml',
  npm: 'package-lock.json',
  yarn: 'yarn.lock',
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Detect the manager the project expects, from its lockfile. Falls back to npm —
 * the one manager always present with Node — when no lockfile is found, so install
 * never picks a tool the machine may not have just because we guessed.
 */
export async function detectPackageManager(projectDir: string): Promise<PackageManager> {
  for (const manager of ['pnpm', 'npm', 'yarn'] as PackageManager[]) {
    if (await fileExists(join(projectDir, LOCKFILE_BY_MANAGER[manager]))) {
      return manager
    }
  }
  return 'npm'
}

/** What the caller wants the post-create phase to do. Both default on; flags turn them off. */
export interface PostCreateOptions {
  initGit: boolean
  installDeps: boolean
}

export const DEFAULT_POST_CREATE: PostCreateOptions = { initGit: true, installDeps: true }

/** One post-create step and whether it succeeded — reported back so the CLI can be honest about each. */
export interface StepOutcome {
  step: string
  ok: boolean
  /** Present only on failure: the tool's own output, so the user sees why. */
  detail?: string
}

/**
 * Reports each step as it starts and finishes, so a caller can show live progress (a spinner) while
 * a slow step — dependency install — runs. Optional: when no reporter is passed, steps run silently
 * and only the returned outcomes tell the story (this is how the tests exercise it, with no terminal).
 */
export interface ProgressReporter {
  start(label: string): void
  done(ok: boolean): void
}

/** Run one step, reporting its start/finish if a reporter is present, and map the result to an outcome. */
async function runStep(
  reporter: ProgressReporter | undefined,
  label: string,
  run: () => Promise<CommandResult>,
): Promise<StepOutcome> {
  reporter?.start(label)
  const outcome = toOutcome(label, await run())
  reporter?.done(outcome.ok)
  return outcome
}

/**
 * Take a freshly copied project the last mile.
 *
 * Order matters and is deliberate:
 *   1. git init → add → commit happens BEFORE install. The template's commit-msg and
 *      pre-commit hooks are activated by husky, which only runs during install; doing
 *      the first commit first means the baseline commit is never blocked by hooks that
 *      aren't set up yet, while every commit AFTER install is properly guarded.
 *   2. install runs last, and its `prepare` script is what switches the hooks on.
 *
 * Never creates a remote repository or a hosting account — that stays the owner's,
 * regardless of where they said they'd version the code (docs/commands.md, Step 4).
 * Steps are independent: a later failure does not undo an earlier success — the copied
 * project is valid either way — so each outcome is reported rather than rolled back.
 */
export async function runPostCreate(
  projectDir: string,
  options: PostCreateOptions,
  runner: CommandRunner,
  reporter?: ProgressReporter,
): Promise<StepOutcome[]> {
  const outcomes: StepOutcome[] = []

  if (options.initGit) {
    outcomes.push(...(await initGit(projectDir, runner, reporter)))
  }

  if (options.installDeps) {
    // Install is the one slow step (it can run for a minute or more), so it is the step the
    // progress spinner exists for — a fresh project's dependency install used to sit silent and
    // look frozen. The manager comes from the template's lockfile.
    const manager = await detectPackageManager(projectDir)
    outcomes.push(
      await runStep(reporter, `install dependencies (${manager})`, () =>
        runner.run(manager, ['install'], projectDir),
      ),
    )
  }

  return outcomes
}

/**
 * Start version control and record the baseline commit. Ordered git calls, ending on
 * the integration branch:
 *   - `git init -b main` pins the official branch name instead of inheriting the
 *     machine's default (which may be anything), so the protected-branch guards and
 *     the docs always agree on what "official" is called.
 *   - The baseline commit lands on main — it IS the official starting point.
 *   - Then `develop` is created and checked out, because main is protected (the
 *     template's guards block direct commits to it) and daily work belongs on the
 *     integration/working levels. Without this, the developer's very next commit
 *     would be blocked by the project's own guard — a dead end.
 */
async function initGit(
  projectDir: string,
  runner: CommandRunner,
  reporter?: ProgressReporter,
): Promise<StepOutcome[]> {
  const outcomes: StepOutcome[] = []

  const init = await runStep(reporter, 'initialize version control (main)', () =>
    runner.run('git', ['init', '-b', 'main'], projectDir),
  )
  outcomes.push(init)
  // If git itself is missing or init failed, the add/commit cannot succeed — skip them
  // rather than emit two more confusing failures for the same root cause.
  if (!init.ok) return outcomes

  const add = await runStep(reporter, 'stage the initial files', () =>
    runner.run('git', ['add', '-A'], projectDir),
  )
  outcomes.push(add)
  if (!add.ok) return outcomes

  // Conventional-commit message WITH scope, so once the commit-msg hook is live
  // (after install) the history already matches the exact format the hook enforces.
  const commit = await runStep(reporter, 'record the first commit', () =>
    runner.run(
      'git',
      ['commit', '-m', 'chore(scaffold): initialize project with keystone'],
      projectDir,
    ),
  )
  outcomes.push(commit)
  if (!commit.ok) return outcomes

  // Leave the developer on the integration branch, ready to work.
  const branch = await runStep(
    reporter,
    'create the develop branch (daily work happens here)',
    () => runner.run('git', ['checkout', '-b', 'develop'], projectDir),
  )
  outcomes.push(branch)

  return outcomes
}

/** Map a raw command result to a user-facing step outcome, keeping output only on failure. */
function toOutcome(step: string, result: CommandResult): StepOutcome {
  return result.ok ? { step, ok: true } : { step, ok: false, detail: result.output }
}
