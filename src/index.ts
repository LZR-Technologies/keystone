#!/usr/bin/env node
// Keystone entry point. Routes the command and runs the matching flow.

// Fail fast on an unsupported runtime: the "engines" field alone does not block an
// install on an older Node — it only warns — so without this check the failure would
// surface later as a confusing runtime error instead of a clear requirement. Static
// imports are hoisted and evaluate before this line, but every internal module parses
// on older Node (plain ES2022, no top-level side effects beyond path resolution), so
// this check is genuinely the first thing that can fail. (The compiled package runs
// on Node 20+; running the TypeScript sources directly needs Node 24+, which the
// runtime itself enforces.)
const MINIMUM_NODE_MAJOR = 20
const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < MINIMUM_NODE_MAJOR) {
  process.stderr.write(
    `Keystone requires Node.js ${MINIMUM_NODE_MAJOR}+ (found ${process.versions.node}).\n`,
  )
  process.exit(1)
}

import { resolve } from 'node:path'
import { runWizard } from './wizard.ts'
import { createProject, type DeducedChoices } from './create.ts'
import { answersFromFlags } from './answers-from-flags.ts'
import { ReadlinePrompter } from './prompter.ts'
import type { KeystoneAnswers } from './types.ts'
import { checkProject } from './guards/runner.ts'
import { analyzeProject } from './analyze/checks.ts'
import { formatReport } from './analyze/report.ts'
import { runPostCreate, DEFAULT_POST_CREATE } from './post-create.ts'
import { createConsoleReporter } from './progress.ts'
import { runProjectGates, anyGateFailed } from './gates/project-gates.ts'
import { ShellRunner } from './exec.ts'
import { print, printError } from './output.ts'

function printHelp(): void {
  print(`
Keystone — start a project born to professional standards.

Usage:
  keystone new [name]    Create a new project (asks a few questions)
  keystone check [dir]   Run the automated guards + project gates (defaults to .)
  keystone analyze [dir] Measure an existing project against the standard (read-only)
  keystone help          Show this help

Options for "new":
  --no-git       Skip initializing version control and the first commit
  --no-install   Skip the slow dependency install for a fast scaffold. The project is still created
                 and versioned; run the install yourself later (the git hooks activate then).

Non-interactive "new" — pass every answer as a flag to skip the wizard entirely:
  --type <site|system|service|mobile>     --language <pt|en|es|other>
  --screen <mobile|desktop|both>          --sensitive <yes|no>
  --version-target <github|gitlab|local>  --private <yes|no>     --dir <path>
  For a system/service, add:  --multi-tenant <yes|no>
  When multi-tenant is yes, add:  --super-admin <yes|no>  --audit-log <yes|no>

Options for "check":
  --no-gates     Run only the fast text guards; skip the project's own tooling
`)
}

/** The first token that is not an --option (used by "check" for its directory). */
function firstPositional(args: string[]): string | undefined {
  return args.find((arg) => !arg.startsWith('--'))
}

/**
 * The project name for "new": the first token, and only when it is not an --option. Restricting it
 * to position 0 (rather than "the first non-flag anywhere") is deliberate — with non-interactive
 * flags carrying values, "the first non-flag anywhere" would mistake a flag's value (the `system`
 * in `--type system`) for the name when the name is omitted. Here, an omitted name yields undefined,
 * which the flag path rejects with a clear error and the wizard path fills by asking.
 */
function newName(args: string[]): string | undefined {
  const first = args[0]
  return first !== undefined && !first.startsWith('--') ? first : undefined
}

async function runNew(args: string[]): Promise<void> {
  const name = newName(args)
  // Non-interactive when answer flags are present (--type ...); otherwise the interactive wizard.
  // This is what lets an AI agent create a project in one shot without reverse-engineering the
  // wizard: it collects the answers as cards, then passes them all as flags. answersFromFlags throws
  // a clear error if the flags are partial, so a botched call fails loudly instead of half-asking.
  const fromFlags = answersFromFlags(args, name)
  const prompter = new ReadlinePrompter()
  try {
    let answers: KeystoneAnswers
    if (fromFlags) {
      answers = fromFlags
    } else {
      print('\nKeystone — let’s set up your project.\n')
      answers = await runWizard(prompter, name)
    }
    const { projectDir, template, deduced } = await createProject(answers)
    print(`\n✓ Project created at ${projectDir}`)
    print(`  From the ${template} template`)
    // Be honest about what these lines mean: they are RECORDED intents in keystone.json, read
    // by a later step — not something already provisioned here. Saying "Security: reinforced"
    // plainly would imply hardening was applied; it was not. The wording below states that the
    // choice was noted, so the user is never misled into thinking a control is already in place.
    print(`  Database (recorded): ${deduced.needsDatabase ? 'needed' : 'not needed'}`)
    print(
      `  Security level (recorded): ${deduced.securityLevel} — noted in keystone.json for later`,
    )
    // Flags only ever turn a step off; both steps are on by default so the project
    // is born versioned, installed, and with its hooks live.
    const options = {
      initGit: DEFAULT_POST_CREATE.initGit && !args.includes('--no-git'),
      installDeps: DEFAULT_POST_CREATE.installDeps && !args.includes('--no-install'),
    }
    await finishSetup(projectDir, options)
    printManualNextSteps(answers, deduced, options.initGit)
  } finally {
    prompter.close()
  }
}

/**
 * Say plainly what creation did NOT do, so the user is never left assuming a remote repository or a
 * database now exists. Keystone initializes version control LOCALLY (commit + branch) but never
 * creates the remote repo, and it records that a database is needed but never provisions one — both
 * are manual next steps. Stating this at the moment (not only in docs) is the honest close: the
 * screen just showed a stream of green checks, and without this the user could reasonably think the
 * repo and database were among them.
 */
function printManualNextSteps(
  answers: KeystoneAnswers,
  deduced: DeducedChoices,
  initGit: boolean,
): void {
  const notes: string[] = []
  const target = answers.setup.versionTarget
  // Only worth saying when a cloud remote was chosen AND version control was actually initialized —
  // "local only" has no remote to create, and --no-git means nothing was versioned to begin with.
  if (initGit && target !== 'local') {
    const service = target === 'github' ? 'GitHub' : 'GitLab'
    notes.push(
      `Remote repository — NOT created. Version control is initialized locally (first commit + ` +
        `develop branch), but the ${service} repository is yours to create and push to.`,
    )
  }
  if (deduced.needsDatabase) {
    notes.push(
      `Database — NOT created. Keystone recorded that this project needs one, but never provisions ` +
        `a database. Create and connect it yourself.`,
    )
  }
  if (notes.length === 0) return
  print('\nStill to do by hand:')
  for (const note of notes) print(`  • ${note}`)
}

/** Run the post-create steps and report each one honestly — a failed step never fails silently. */
async function finishSetup(
  projectDir: string,
  options: { initGit: boolean; installDeps: boolean },
): Promise<void> {
  if (!options.initGit && !options.installDeps) return

  print('\nFinishing setup…')
  // The reporter prints each step's spinner (in a terminal) and its finishing check as it goes, so a
  // slow install shows a sign of life instead of sitting silent. Here we only add the failure detail
  // (the reporter's one-line mark doesn't carry it) and set the aggregate exit code.
  const outcomes = await runPostCreate(
    projectDir,
    options,
    new ShellRunner(),
    createConsoleReporter(),
  )
  for (const outcome of outcomes) {
    if (!outcome.ok && outcome.detail) printError(`    ${outcome.detail.split('\n')[0]}`)
  }
  // Surface any failure in the exit code so a script calling Keystone can tell the
  // project needs a manual step, without treating the whole creation as lost.
  if (outcomes.some((o) => !o.ok)) {
    printError('\nSome setup steps did not complete — the project exists; finish them by hand.')
    process.exitCode = 1
  }
}

async function runCheck(args: string[]): Promise<void> {
  const dir = resolve(firstPositional(args) ?? '.')
  const runGates = !args.includes('--no-gates')

  // Front 1 — the fast text guards (secrets, size, dangerous patterns). Always run.
  const findings = await checkProject(dir)
  if (findings.length === 0) {
    print('✓ Text guards passed — no issues found.')
  } else {
    for (const finding of findings) {
      printError(`✗ ${finding.file}:${finding.line} — ${finding.message}`)
    }
    printError(`${findings.length} issue(s) found by the text guards.`)
  }

  // Front 2 — the project gates (its own formatter, linter, types, tests, audit).
  // These are the enforcing checks: they run the project's tooling and block on failure.
  let gatesFailed = false
  if (runGates) {
    print('\nProject gates:')
    const gates = await runProjectGates(dir, new ShellRunner())
    for (const gate of gates) {
      const mark = gate.status === 'passed' ? '✓' : gate.status === 'skipped' ? '–' : '✗'
      const suffix = gate.detail ? ` — ${gate.detail}` : ''
      const line = `  ${mark} [${gate.pillar}] ${gate.name}${suffix}`
      if (gate.status === 'failed') printError(line)
      else print(line)
    }
    gatesFailed = anyGateFailed(gates)
  }

  // Exit non-zero when anything blocking failed, so a pre-ship script can rely on it.
  if (findings.length > 0 || gatesFailed) {
    process.exitCode = 1
  }
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2)

  switch (command) {
    case 'new':
      await runNew(rest)
      break
    case 'check':
      await runCheck(rest)
      break
    case 'analyze':
      print(formatReport(await analyzeProject(resolve(rest[0] ?? '.'))))
      break
    case 'help':
    case undefined:
      printHelp()
      break
    default:
      printError(`Unknown command: ${command}\n`)
      printHelp()
      process.exitCode = 1
  }
}

// One catch at the top so an expected operational failure (input ending mid-wizard,
// an unreachable directory) exits with a clean one-line message and a non-zero code —
// never a raw stack trace at the user.
try {
  await main()
} catch (error) {
  printError(`Error: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
