// Tests for Step 5 — analysis: deterministic checks, the report, and end-to-end.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runChecks, analyzeProject, type Snapshot } from '../src/analyze/checks.ts'
import { formatReport } from '../src/analyze/report.ts'
import { createProject } from '../src/create.ts'
import type { KeystoneAnswers } from '../src/types.ts'

function snapshot(over: Partial<Snapshot> = {}): Snapshot {
  return { paths: [], files: [], ...over }
}

test('runChecks: flags missing tests and missing README', () => {
  const results = runChecks(snapshot({ paths: ['src/app.ts'], files: [] }))
  const tests = results.find((r) => r.pillar === 'Tests')
  const docs = results.find((r) => r.title === 'Has a README')
  assert.equal(tests?.passed, false)
  assert.equal(docs?.passed, false)
})

test('runChecks: detects an exposed secret', () => {
  // sample assembled from parts so this file does not self-flag when scanned
  const leaked = `const k = "${'AKIA' + 'ABCDEFGHIJKLMNOP'}";`
  const results = runChecks(snapshot({ files: [{ path: 'a.ts', content: leaked }] }))
  const sec = results.find((r) => r.title === 'No exposed secrets')
  assert.equal(sec?.passed, false)
  assert.equal(sec?.severity, 'high')
})

test('runChecks: database without the conventions fails', () => {
  const sql = 'create table t (id serial primary key);'
  const results = runChecks(snapshot({ files: [{ path: 'db/x.sql', content: sql }] }))
  const db = results.find((r) => r.pillar === 'Database')
  assert.equal(db?.passed, false)
  assert.match(db?.detail ?? '', /missing/)
})

test('runChecks: tenant_id mentioned only in a comment does NOT count as tenant isolation', () => {
  // The single-owner variant explains its deliberate lack of tenant_id in a comment. That mention
  // must not be read as real isolation — otherwise a single-owner schema wins a false isolation seal.
  const sql = [
    '-- This project serves ONE owner, so there is no tenant_id column.',
    '/* If you later need multiple clients, add tenant_id to every table. */',
    'create table items (id uuid primary key, created_at timestamptz, deleted_at timestamptz);',
  ].join('\n')
  const results = runChecks(snapshot({ files: [{ path: 'db/x.sql', content: sql }] }))
  const db = results.find((r) => r.pillar === 'Database')
  // The core conventions are present, so the check passes — but it must state the absence of tenant
  // isolation plainly, never imply it exists.
  assert.equal(db?.passed, true, 'core conventions present → the check passes')
  assert.match(db?.detail ?? '', /single-owner/, 'detail names it as single-owner')
  assert.doesNotMatch(
    db?.detail ?? '',
    /including tenant isolation/,
    'never claims isolation on a comment-only mention',
  )
})

test('runChecks: a real tenant_id column DOES count as tenant isolation', () => {
  // A genuine tenant_id column (not a comment) is real multi-tenant isolation and must be reported.
  const sql =
    'create table items (id uuid primary key, tenant_id uuid not null, created_at timestamptz, deleted_at timestamptz);'
  const results = runChecks(snapshot({ files: [{ path: 'db/x.sql', content: sql }] }))
  const db = results.find((r) => r.pillar === 'Database')
  assert.equal(db?.passed, true)
  assert.match(db?.detail ?? '', /including tenant isolation/, 'real column → isolation reported')
})

test('formatReport: a single-owner schema is not presented as having isolation', () => {
  // End-to-end through the report text: a single-owner schema must never render a line that a reader
  // could take as "this project has tenant isolation".
  const sql = [
    '-- no tenant_id here on purpose',
    'create table items (id uuid primary key, created_at timestamptz, deleted_at timestamptz);',
  ].join('\n')
  const results = runChecks(
    snapshot({ paths: ['db/x.sql'], files: [{ path: 'db/x.sql', content: sql }] }),
  )
  const out = formatReport(results)
  assert.match(out, /single-owner schema — no tenant isolation/)
  assert.doesNotMatch(out, /including tenant isolation/)
})

test('runChecks + formatReport: a project with no database is not-applicable, not a green pass', () => {
  const results = runChecks(snapshot({ paths: ['src/app.ts'], files: [] }))
  const db = results.find((r) => r.pillar === 'Database')
  // Marked not-applicable so the report can show it neutrally.
  assert.equal(db?.notApplicable, true)
  const out = formatReport(results)
  // The database line uses the neutral dash and states "not applicable" — never a green ✓.
  assert.match(out, /– \[Database\].*not applicable/)
  assert.doesNotMatch(out, /✓ \[Database\]/)
})

test('formatReport: shows the three parts and orders by severity', () => {
  const results = runChecks(snapshot({ paths: ['src/app.ts'] }))
  const out = formatReport(results)
  assert.match(out, /Where it stands/)
  assert.match(out, /Upgrade plan/)
  // a high-severity item (tests) should appear before a low one in the plan
  const planStart = out.indexOf('Upgrade plan')
  assert.ok(out.indexOf('Tests', planStart) < out.indexOf('Documentation', planStart))
})

test('analyzeProject: a freshly created project meets the standard, example test included', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'keystone-an-'))
  try {
    const answers: KeystoneAnswers = {
      product: {
        name: 'shop',
        type: 'system',
        language: 'pt',
        screen: 'both',
        look: 'later',
        sensitive: true,
      },
      setup: { versionTarget: 'local', isPrivate: false, parentDir: parent },
    }
    const { projectDir } = await createProject(answers)
    const results = await analyzeProject(projectDir)

    // The template ships a README, .gitignore with .env, db conventions, and an example test.
    assert.equal(results.find((r) => r.title === 'Has a README')?.passed, true)
    assert.equal(results.find((r) => r.title.startsWith('Secrets kept'))?.passed, true)
    assert.equal(results.find((r) => r.pillar === 'Database')?.passed, true)
    // The template now ships an example test, so a brand-new project already has one.
    assert.equal(results.find((r) => r.pillar === 'Tests')?.passed, true)
  } finally {
    await rm(parent, { recursive: true, force: true })
  }
})
