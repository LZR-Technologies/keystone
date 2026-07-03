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
import { createProject } from './create.ts'
import { ReadlinePrompter } from './prompter.ts'
import { checkProject } from './guards/runner.ts'
import { analyzeProject } from './analyze/checks.ts'
import { formatReport } from './analyze/report.ts'
import { runPostCreate, DEFAULT_POST_CREATE } from './post-create.ts'
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
  --no-install   Skip installing dependencies (leaves git hooks inactive)

Options for "check":
  --no-gates     Run only the fast text guards; skip the project's own tooling
`)
}

/** The name argument for "new" is the first token that is not an --option. */
function firstPositional(args: string[]): string | undefined {
  return args.find((arg) => !arg.startsWith('--'))
}

async function runNew(args: string[]): Promise<void> {
  const prompter = new ReadlinePrompter()
  try {
    print('\nKeystone — let’s set up your project.\n')
    const answers = await runWizard(prompter, firstPositional(args))
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
  } finally {
    prompter.close()
  }
}

/** Run the post-create steps and report each one honestly — a failed step never fails silently. */
async function finishSetup(
  projectDir: string,
  options: { initGit: boolean; installDeps: boolean },
): Promise<void> {
  if (!options.initGit && !options.installDeps) return

  print('\nFinishing setup…')
  const outcomes = await runPostCreate(projectDir, options, new ShellRunner())
  for (const outcome of outcomes) {
    if (outcome.ok) {
      print(`  ✓ ${outcome.step}`)
    } else {
      printError(`  ✗ ${outcome.step}`)
      if (outcome.detail) printError(`    ${outcome.detail.split('\n')[0]}`)
    }
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
