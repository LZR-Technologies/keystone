// Tests for Step 5 — analysis: deterministic checks, the report, and end-to-end.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runChecks, analyzeProject, type Snapshot } from '../src/analyze/checks.ts';
import { formatReport } from '../src/analyze/report.ts';
import { createProject } from '../src/create.ts';
import type { KeystoneAnswers } from '../src/types.ts';

function snapshot(over: Partial<Snapshot> = {}): Snapshot {
  return { paths: [], files: [], ...over };
}

test('runChecks: flags missing tests and missing README', () => {
  const results = runChecks(snapshot({ paths: ['src/app.ts'], files: [] }));
  const tests = results.find((r) => r.pillar === 'Tests');
  const docs = results.find((r) => r.title === 'Has a README');
  assert.equal(tests?.passed, false);
  assert.equal(docs?.passed, false);
});

test('runChecks: detects an exposed secret', () => {
  // sample assembled from parts so this file does not self-flag when scanned
  const leaked = `const k = "${'AKIA' + 'ABCDEFGHIJKLMNOP'}";`;
  const results = runChecks(snapshot({ files: [{ path: 'a.ts', content: leaked }] }));
  const sec = results.find((r) => r.title === 'No exposed secrets');
  assert.equal(sec?.passed, false);
  assert.equal(sec?.severity, 'high');
});

test('runChecks: database without the conventions fails', () => {
  const sql = 'create table t (id serial primary key);';
  const results = runChecks(snapshot({ files: [{ path: 'db/x.sql', content: sql }] }));
  const db = results.find((r) => r.pillar === 'Database');
  assert.equal(db?.passed, false);
  assert.match(db?.detail ?? '', /missing/);
});

test('formatReport: shows the three parts and orders by severity', () => {
  const results = runChecks(snapshot({ paths: ['src/app.ts'] }));
  const out = formatReport(results);
  assert.match(out, /Where it stands/);
  assert.match(out, /Upgrade plan/);
  // a high-severity item (tests) should appear before a low one in the plan
  const planStart = out.indexOf('Upgrade plan');
  assert.ok(out.indexOf('Tests', planStart) < out.indexOf('Documentation', planStart));
});

test('analyzeProject: a freshly created project mostly passes but has no tests yet', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'keystone-an-'));
  try {
    const answers: KeystoneAnswers = {
      product: { name: 'shop', type: 'system', language: 'pt', screen: 'both', look: 'later', sensitive: true },
      setup: { versionTarget: 'local', isPrivate: false, parentDir: parent },
    };
    const { projectDir } = await createProject(answers);
    const results = await analyzeProject(projectDir);

    // The mould ships a README, .gitignore with .env, and db conventions.
    assert.equal(results.find((r) => r.title === 'Has a README')?.passed, true);
    assert.equal(results.find((r) => r.title.startsWith('Secrets kept'))?.passed, true);
    assert.equal(results.find((r) => r.pillar === 'Database')?.passed, true);
    // But a brand-new project has no tests of its own yet.
    assert.equal(results.find((r) => r.pillar === 'Tests')?.passed, false);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
