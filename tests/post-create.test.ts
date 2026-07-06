// Tests for the post-create phase: version control, dependency install, and the
// order between them. The CommandRunner is recorded, so nothing actually runs — the
// tests assert on which commands would fire, and in what order.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RecordingRunner } from '../src/exec.ts'
import { detectPackageManager, runPostCreate } from '../src/post-create.ts'

async function tempProject(lockfile?: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'keystone-pc-'))
  if (lockfile) await writeFile(join(dir, lockfile), '')
  return dir
}

test('detectPackageManager: a pnpm lockfile means pnpm', async () => {
  const dir = await tempProject('pnpm-lock.yaml')
  try {
    assert.equal(await detectPackageManager(dir), 'pnpm')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('detectPackageManager: an npm lockfile means npm', async () => {
  const dir = await tempProject('package-lock.json')
  try {
    assert.equal(await detectPackageManager(dir), 'npm')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('detectPackageManager: no lockfile falls back to npm', async () => {
  const dir = await tempProject()
  try {
    assert.equal(await detectPackageManager(dir), 'npm')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('runPostCreate: full run inits git, commits, then installs — in that order', async () => {
  const dir = await tempProject('pnpm-lock.yaml')
  const runner = new RecordingRunner()
  try {
    const outcomes = await runPostCreate(dir, { initGit: true, installDeps: true }, runner)
    const sequence = runner.calls.map((c) => `${c.command} ${c.args[0]}`)
    // git work happens before install, so the baseline commit is never blocked by
    // hooks that install has not switched on yet — and the developer is left on the
    // integration branch, because main is protected by the template's own guards.
    assert.deepEqual(sequence, [
      'git init',
      'git add',
      'git commit',
      'git checkout',
      'pnpm install',
    ])
    // The official branch is pinned (never the machine default) and develop is created.
    const init = runner.calls[0]
    assert.deepEqual(init?.args, ['init', '-b', 'main'], 'official branch is pinned to main')
    const checkout = runner.calls[3]
    assert.deepEqual(checkout?.args, ['checkout', '-b', 'develop'], 'work continues on develop')
    // The baseline message carries a scope, matching the commit rule the hooks enforce.
    const commitArgs = runner.calls[2]?.args ?? []
    assert.match(String(commitArgs[2]), /^chore\(scaffold\): /)
    assert.ok(outcomes.every((o) => o.ok))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('runPostCreate: --no-git skips version control but still installs', async () => {
  const dir = await tempProject('pnpm-lock.yaml')
  const runner = new RecordingRunner()
  try {
    await runPostCreate(dir, { initGit: false, installDeps: true }, runner)
    assert.deepEqual(
      runner.calls.map((c) => c.command),
      ['pnpm'],
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('runPostCreate: --no-install skips install but still versions', async () => {
  const dir = await tempProject('pnpm-lock.yaml')
  const runner = new RecordingRunner()
  try {
    await runPostCreate(dir, { initGit: true, installDeps: false }, runner)
    // Four git calls: init, add, commit, and the checkout onto develop.
    assert.deepEqual(
      runner.calls.map((c) => c.command),
      ['git', 'git', 'git', 'git'],
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('runPostCreate: reports each step start and finish to a progress reporter, in order', async () => {
  const dir = await tempProject('pnpm-lock.yaml')
  const runner = new RecordingRunner()
  const events: string[] = []
  const reporter = {
    start: (label: string): void => {
      events.push(`start:${label}`)
    },
    done: (ok: boolean): void => {
      events.push(`done:${ok}`)
    },
  }
  try {
    await runPostCreate(dir, { initGit: true, installDeps: true }, runner, reporter)
    // Five steps, each announced then finished, ending on the install — this is what drives the
    // spinner: the caller knows the moment each step begins and ends.
    assert.equal(events.filter((e) => e.startsWith('start:')).length, 5)
    assert.equal(events[0], 'start:initialize version control (main)')
    assert.equal(events.at(-2), 'start:install dependencies (pnpm)')
    assert.equal(events.at(-1), 'done:true')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('runPostCreate: a failed git init skips add and commit (same root cause)', async () => {
  const dir = await tempProject('pnpm-lock.yaml')
  // Make git fail: git init reports non-zero, so add/commit must not run.
  const runner = new RecordingRunner(['git'])
  try {
    const outcomes = await runPostCreate(dir, { initGit: true, installDeps: true }, runner)
    const gitCalls = runner.calls.filter((c) => c.command === 'git')
    assert.equal(gitCalls.length, 1, 'only git init should have been attempted')
    assert.equal(outcomes[0]?.ok, false)
    assert.ok(outcomes[0]?.step.includes('initialize'))
    // install is independent and still runs — a git failure does not cancel it.
    assert.ok(runner.calls.some((c) => c.command === 'pnpm'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
