// Tests for AI-provider secret detection (OpenAI, Anthropic) — the commonest 2026 leak.
//
// This test file is kept separate from tests/guards.test.ts on purpose: that file belongs
// to another author, so the AI-key coverage lives here instead of editing theirs.
//
// The sample keys are assembled from parts so this file does not itself trip the detector
// when Keystone scans its own project — the same root-cause fix used across the guards.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scanSecrets } from '../src/guards/secrets.ts'

test('scanSecrets: flags an OpenAI API key by its shape', () => {
  // Classic account key form (sk-...): assembled from parts so scanning this repo stays clean.
  const leaked = `const k = "${'sk-' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'}";`
  const [finding] = scanSecrets('a.ts', leaked)
  assert.ok(finding)
  assert.match(finding.message, /OpenAI/)
})

test('scanSecrets: flags an OpenAI project-scoped key', () => {
  const leaked = `const k = "${'sk-' + 'proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123'}";`
  const [finding] = scanSecrets('a.ts', leaked)
  assert.ok(finding)
  assert.match(finding.message, /OpenAI/)
})

test('scanSecrets: flags an Anthropic API key by its shape', () => {
  const leaked = `const k = "${'sk-' + 'ant-api03-ABCDEFGHIJKLMNOPQRSTUVWXYZ'}";`
  const [finding] = scanSecrets('a.ts', leaked)
  assert.ok(finding)
  assert.match(finding.message, /Anthropic/)
})

test('scanSecrets: no false positive on a short sk- lookalike in prose', () => {
  // A bare "sk-" with only a few characters is not a key; it must not be flagged.
  assert.deepEqual(scanSecrets('a.ts', 'the sk-1 abbreviation means something else'), [])
})
