// File split to respect the tool's own 400-line guard: these tests were originally part of
// harness.test.ts, which grew past the 400-line size limit that `keystone check` enforces on
// every file (including the tool's own source and tests). This file holds the spec OS rules
// (constitution, clarify, plan-and-tasks, verify, test-first-by-risk, subagent-driven-development,
// discovery) and the Layer C experience-quality rules; harness.test.ts keeps the harness
// scaffolding, pre-push gate, server-side rails, and the two guardrail-hook tests. No test
// content was changed by the split -- only moved.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

test('spec OS: every generated project ships the plan-and-tasks rule with real content', async () => {
  // An approved spec becomes a plan, then small tasks each traceable to the done-target. The
  // rule must ship with that real guidance, not a stub, in every project.
  for (const type of ['service', 'site'] as const) {
    const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
    try {
      const { projectDir } = await createProject(answers(type, parent))
      const rule = await readFile(join(projectDir, '.claude/rules/plan-and-tasks.md'), 'utf8')
      for (const marker of ['Plan first', 'small tasks', 'Trace each task', 'done-target']) {
        assert.ok(rule.includes(marker), `${type}: plan-and-tasks rule covers "${marker}"`)
      }
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }
})

test('spec OS: every generated project ships the verify-against-done-target rule with real content', async () => {
  // Before "done", the delivery is checked against the done-target point by point and every gap
  // named. The rule must ship with that real discipline, not a stub, in every project.
  for (const type of ['service', 'site'] as const) {
    const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
    try {
      const { projectDir } = await createProject(answers(type, parent))
      const rule = await readFile(
        join(projectDir, '.claude/rules/verify-against-done-target.md'),
        'utf8',
      )
      for (const marker of [
        'Walk the done-target',
        'Walk the task list',
        'Name every gap',
        'hollow shell',
      ]) {
        assert.ok(rule.includes(marker), `${type}: verify rule covers "${marker}"`)
      }
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }
})

test('spec OS: every generated project ships the test-first-by-risk rule with its real matrix', async () => {
  // The matrix decides when a change is test-first vs regression vs risk-judged. It must ship with
  // its real rows, not a stub, in every project.
  for (const type of ['service', 'site'] as const) {
    const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
    try {
      const { projectDir } = await createProject(answers(type, parent))
      const rule = await readFile(join(projectDir, '.claude/rules/test-first-by-risk.md'), 'utf8')
      for (const row of [
        'Test-first, always',
        'Regression test, always',
        'Test by risk',
        'Automatic validation',
      ]) {
        assert.ok(rule.includes(row), `${type}: test-first matrix has "${row}"`)
      }
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }
})

test('spec OS: every generated project ships the subagent-driven-development rule with its real loop', async () => {
  // Substantial work is done by a fresh subagent per task, reviewed in two stages. The rule must
  // ship with its real loop, not a stub, in every project.
  for (const type of ['service', 'site'] as const) {
    const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
    try {
      const { projectDir } = await createProject(answers(type, parent))
      const rule = await readFile(
        join(projectDir, '.claude/rules/subagent-driven-development.md'),
        'utf8',
      )
      for (const step of [
        'Dispatch a fresh implementer',
        'Spec compliance',
        'Code quality',
        'A critical issue blocks',
      ]) {
        assert.ok(rule.includes(step), `${type}: subagent loop has "${step}"`)
      }
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }
})

test('spec OS: every generated project ships discovery — the rule and the adaptive template', async () => {
  // Before the technical spec, substantial work does product/UX/business discovery, scaled by level.
  // Both the rule and the fill-in template must ship with real content, not stubs, in every project.
  for (const type of ['service', 'site'] as const) {
    const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
    try {
      const { projectDir } = await createProject(answers(type, parent))
      const rule = await readFile(
        join(projectDir, '.claude/rules/discovery-before-spec.md'),
        'utf8',
      )
      for (const marker of ['business questions', 'UX artifacts', 'Critical / regulated']) {
        assert.ok(rule.includes(marker), `${type}: discovery rule covers "${marker}"`)
      }
      const template = await readFile(join(projectDir, 'discovery/discovery.md'), 'utf8')
      for (const section of ['## Problem', '## Value proposition', '## UX journey']) {
        assert.ok(template.includes(section), `${type}: discovery template has "${section}"`)
      }
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }
})

test('experience quality (Layer C): every generated project ships the checklist rule with real content', async () => {
  // Layer C — a usable interface is part of "done". The mandatory experience checklist ships in every
  // project (a UI-less service still carries it and declares its own honest skip) and must hold its
  // real questions, not a stub.
  for (const type of ['service', 'site'] as const) {
    const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
    try {
      const { projectDir } = await createProject(answers(type, parent))
      const rule = await readFile(join(projectDir, '.claude/rules/experience-quality.md'), 'utf8')
      for (const question of [
        'Visual hierarchy',
        'The four states',
        'Touch targets',
        'Coherence with the spec',
      ]) {
        assert.ok(rule.includes(question), `${type}: experience checklist has "${question}"`)
      }
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }
})

test('experience quality (Layer C): every generated project ships the three experience reviewers', async () => {
  // The C3 reviewers judge what the hard gates cannot. Each must ship with a real mandate (not a
  // stub) and declare it recommends rather than blocks, in every project — they cost nothing until
  // invoked.
  const reviewers: Record<string, string> = {
    'experience-reviewer.md': 'Visual hierarchy',
    'accessibility-reviewer.md': 'Keyboard, fully',
    'ui-consistency-reviewer.md': 'never hardcoded, never invented',
  }
  for (const type of ['service', 'site'] as const) {
    const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
    try {
      const { projectDir } = await createProject(answers(type, parent))
      for (const [file, marker] of Object.entries(reviewers)) {
        const agent = await readFile(join(projectDir, '.claude/agents', file), 'utf8')
        assert.ok(agent.includes(marker), `${type}: ${file} ships with real content ("${marker}")`)
        assert.ok(
          agent.includes('does not block on its own'),
          `${type}: ${file} declares it recommends, not blocks`,
        )
      }
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }
})
