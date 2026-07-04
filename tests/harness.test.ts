// Tests for Layer B — the agent harness: it lands in every generated project, and its
// guardrails actually block (exit 2), not merely warn.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createProject } from '../src/create.ts'
import type { KeystoneAnswers, ProjectType } from '../src/types.ts'

function answers(type: ProjectType, parentDir: string): KeystoneAnswers {
  return {
    product: {
      name: 'demo-app',
      type,
      language: 'pt',
      screen: 'both',
      look: 'later',
      sensitive: false,
    },
    setup: { versionTarget: 'local', isPrivate: false, parentDir },
  }
}

test('harness: every generated project ships with the seven-part harness', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
  try {
    const { projectDir } = await createProject(answers('site', parent))
    for (const f of [
      '.claude/rules/example-rule.md', // B1 — layered context
      'specs/000-example-feature/spec.md', // B2 — spec workflow
      '.claude/agents/spec-reviewer.md', // B3 — subagents
      '.claude/agents/code-reviewer.md', // B3
      '.claude/agents/security-auditor.md', // B3
      '.claude/hooks/block-secret.mjs', // B4 — guardrails
      '.claude/hooks/block-protected-branch.mjs', // B4
      '.claude/settings.json', // B4 wiring
      '.claude/rules/session-lifecycle.md', // B5 — session continuity (hand-off flow)
      'knowledge/project-journal/briefings/README.md', // B5 — briefing structure
      'knowledge/project-journal/daily-log/README.md', // B5 — per-coder daily log
      '.claude/rules/long-term-memory.md', // B6 — long-term memory
      'memory/MEMORY.md', // B6 — the memory index, in place from the start
      '.claude/rules/work-tracking.md', // B7 — one branch = one issue = one PR
      'docs/agent-harness.md', // the map
    ]) {
      assert.ok((await stat(join(projectDir, f))).isFile(), `expected ${f} in the project`)
    }
  } finally {
    await rm(parent, { recursive: true, force: true })
  }
})

test('guardrail: a generated project pushes only through the full gate (both templates)', async () => {
  // The pre-push hook must run the WHOLE gate — types, lint, formatting, tests — not a partial
  // one, so a lint or formatting error cannot leave the machine. Proven by content: the hook
  // calls `pnpm run check`, and the project's `check` script composes all four gates.
  for (const type of ['service', 'site'] as const) {
    const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
    try {
      const { projectDir } = await createProject(answers(type, parent))
      const prePush = await readFile(join(projectDir, '.husky/pre-push'), 'utf8')
      assert.match(prePush, /pnpm run check/, `${type}: pre-push runs the full gate`)
      const pkg = JSON.parse(await readFile(join(projectDir, 'package.json'), 'utf8'))
      for (const gate of ['typecheck', 'lint', 'format:check', 'test']) {
        assert.ok(String(pkg.scripts.check).includes(gate), `${type}: check must include ${gate}`)
      }
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }
})

test('guardrail: generated projects ship the hard server-side rails (both templates)', async () => {
  // A PR with no linked issue is failed by a CI workflow; CODEOWNERS mandates owner review on
  // migrations; and setup-branch-protection.sh requires code-owner review plus the issue-link
  // check. All ship in every project. Honest limit: GitHub enforces them once the owner runs the
  // script — Keystone guarantees they are present with the right content, not that a live repo
  // has them switched on.
  for (const type of ['service', 'site'] as const) {
    const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
    try {
      const { projectDir } = await createProject(answers(type, parent))
      assert.ok(
        (await stat(join(projectDir, '.github/workflows/pr-issue-link.yml'))).isFile(),
        `${type}: the PR-issue-link workflow ships`,
      )
      const codeowners = await readFile(join(projectDir, '.github/CODEOWNERS'), 'utf8')
      assert.match(codeowners, /db\/migrations\//, `${type}: CODEOWNERS covers migrations`)
      const protection = await readFile(
        join(projectDir, 'scripts/setup-branch-protection.sh'),
        'utf8',
      )
      assert.match(
        protection,
        /require_code_owner_reviews/,
        `${type}: branch protection requires code-owner review`,
      )
      assert.match(
        protection,
        /Linked issue required/,
        `${type}: the issue-link check is a required status check`,
      )
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }
})

test('spec OS: every generated project ships the project constitution with real content', async () => {
  // The constitution is the top authority above individual specs. It must ship with real
  // non-negotiables (not an empty stub) in every project, both templates.
  for (const type of ['service', 'site'] as const) {
    const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
    try {
      const { projectDir } = await createProject(answers(type, parent))
      const constitution = await readFile(join(projectDir, 'specs/constitution.md'), 'utf8')
      // Real sections, not a placeholder.
      for (const section of ['## Security', '## Data', '## Testing and the definition of done']) {
        assert.ok(constitution.includes(section), `${type}: constitution has "${section}"`)
      }
      // It declares itself the authority above specs.
      assert.match(
        constitution,
        /the constitution wins/i,
        `${type}: constitution states it wins on conflict`,
      )
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }
})

test('spec OS: every generated project ships the clarify-before-building rule with real content', async () => {
  // Before code, the agent surfaces ambiguity/conflict/undefined-rule/edge-case/untestable and
  // asks. The rule must ship with its five real checks, not a stub, in every project.
  for (const type of ['service', 'site'] as const) {
    const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
    try {
      const { projectDir } = await createProject(answers(type, parent))
      const rule = await readFile(
        join(projectDir, '.claude/rules/clarify-before-building.md'),
        'utf8',
      )
      for (const check of [
        'Ambiguity',
        'Conflict',
        'Undefined rule',
        'Edge case',
        'Untestable requirement',
      ]) {
        assert.ok(rule.includes(check), `${type}: clarify rule covers "${check}"`)
      }
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }
})

// Run a guardrail hook exactly as Claude Code would: JSON tool call on stdin, read the
// exit code (2 = blocked, 0 = allowed).
const SECRET_HOOK = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'templates/agent-harness/.claude/hooks/block-secret.mjs',
)

function runSecretHook(command: string): number {
  const res = spawnSync('node', [SECRET_HOOK], {
    input: JSON.stringify({ tool_input: { command } }),
    encoding: 'utf8',
  })
  return res.status ?? -1
}

test('guardrail: the secret hook blocks reading a .env file (exit 2)', () => {
  // command assembled from parts, same discipline as the scanners
  assert.equal(runSecretHook('cat ' + '.env'), 2)
})

test('guardrail: the secret hook allows a harmless command (exit 0)', () => {
  assert.equal(runSecretHook('ls -la'), 0)
})

// The protected-branch hook decides by asking git for the CURRENT branch of its working
// directory — so proving it takes a real repository, once on a protected branch and once
// on a working branch. This is what makes "guardrails proven by test" true for BOTH hooks.
const BRANCH_HOOK = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'templates/agent-harness/.claude/hooks/block-protected-branch.mjs',
)

function runBranchHook(command: string, cwd: string): number {
  const res = spawnSync('node', [BRANCH_HOOK], {
    input: JSON.stringify({ tool_input: { command } }),
    encoding: 'utf8',
    cwd,
  })
  return res.status ?? -1
}

/** A throwaway git repository sitting on the given branch, with one baseline commit. */
function gitRepoOn(branch: string, dir: string): void {
  const git = (...args: string[]): void => {
    const res = spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
    assert.equal(res.status, 0, `git ${args[0]} failed: ${res.stderr}`)
  }
  git('init', '-b', branch)
  // Identity is required for the commit; scoped to this repo only.
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Test')
  git('commit', '--allow-empty', '-m', 'chore(test): baseline')
}

test('guardrail: the branch hook blocks a commit on a protected branch (exit 2)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'keystone-branch-'))
  try {
    gitRepoOn('main', dir)
    assert.equal(runBranchHook('git commit -m "feat(x): change"', dir), 2)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('guardrail: the branch hook allows a commit on a working branch (exit 0)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'keystone-branch-'))
  try {
    gitRepoOn('feat/some-work', dir)
    assert.equal(runBranchHook('git commit -m "feat(x): change"', dir), 0)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('guardrail: the branch hook ignores commands that are not commit/push (exit 0)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'keystone-branch-'))
  try {
    gitRepoOn('main', dir)
    // Reading state on a protected branch is fine; only landing code is blocked.
    assert.equal(runBranchHook('git status', dir), 0)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
