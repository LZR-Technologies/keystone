// Tests for the automated guards: secret detection, size, and self-governance.
//
// The sample secrets are assembled from parts so this test file does not itself
// trip the detector when Keystone scans its own project — the same root-cause fix
// used in the detector, not an exception.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scanSecrets } from '../src/guards/secrets.ts'
import { scanSize } from '../src/guards/size.ts'
import { scanDangerous } from '../src/guards/dangerous.ts'
import { runGuardsOnContent, checkProject } from '../src/guards/runner.ts'

const AWS_SAMPLE = `const k = "${'AKIA' + 'ABCDEFGHIJKLMNOP'}";`
const API_SAMPLE = `const apiKey = "${'abcdef1234567890'}";`
const PRIVATE_KEY_SAMPLE = '-----BEGIN PRIVATE ' + 'KEY-----'

// Dangerous samples are assembled from parts for the same reason as the secrets:
// so this test file does not trip the detector when Keystone scans its own project.
const EVAL_SAMPLE = `const r = ${'ev' + 'al'}(userInput);`
const REACT_HTML_SAMPLE = `<div ${'dangerously' + 'SetInner' + 'HTML'}={{ __html: raw }} />`
const DOM_HTML_SAMPLE = `el.${'inner' + 'HTML'} = userInput;`
const SHELL_SAMPLE = 'exec' + 'Sync(`rm -rf ${dir}`);'

test('scanSecrets: flags an AWS access key', () => {
  const [finding] = scanSecrets('a.ts', AWS_SAMPLE)
  assert.ok(finding)
  assert.match(finding.message, /AWS/)
})

test('scanSecrets: flags an api key assignment', () => {
  assert.equal(scanSecrets('a.ts', API_SAMPLE).length, 1)
})

test('scanSecrets: flags a private key block', () => {
  assert.equal(scanSecrets('a.ts', PRIVATE_KEY_SAMPLE).length, 1)
})

test('scanSecrets: flags a provider key by its shape, not the variable name', () => {
  // The worst real-world leak: a live key hardcoded with an innocent name. Assembled
  // from parts so this test file does not trip the scanner scanning its own project.
  const stripe = `const k = "${'sk_' + 'live_51Habcdefghijklmnop'}";`
  const [finding] = scanSecrets('a.ts', stripe)
  assert.ok(finding)
  assert.match(finding.message, /Stripe/)
})

test('scanSecrets: no false positive on clean code', () => {
  assert.deepEqual(scanSecrets('a.ts', 'const total = price * quantity;'), [])
})

test('scanDangerous: flags dynamic code execution', () => {
  const [finding] = scanDangerous('a.ts', EVAL_SAMPLE)
  assert.ok(finding)
  assert.equal(finding.guard, 'dangerous')
})

test('scanDangerous: flags raw HTML injection (React)', () => {
  assert.equal(scanDangerous('a.tsx', REACT_HTML_SAMPLE).length, 1)
})

test('scanDangerous: flags a direct DOM HTML write', () => {
  assert.equal(scanDangerous('a.ts', DOM_HTML_SAMPLE).length, 1)
})

test('scanDangerous: flags a shell command built with interpolation', () => {
  assert.equal(scanDangerous('a.ts', SHELL_SAMPLE).length, 1)
})

test('scanDangerous: no false positive on a database driver .exec() method call', () => {
  // Every database driver exposes .exec/.query with template literals (e.g. the
  // tenant-isolation integration tests) — a METHOD call is not a shell command.
  const dbCall = 'await db.' + 'exec(`set role ${APP_ROLE};`)'
  assert.deepEqual(scanDangerous('a.ts', dbCall), [])
})

test('scanDangerous: no false positive on an equality comparison', () => {
  // `===` must not be mistaken for an innerHTML assignment.
  assert.deepEqual(scanDangerous('a.ts', 'if (el.innerHTML === expected) ok();'), [])
})

test('scanDangerous: no false positive on clean code', () => {
  assert.deepEqual(scanDangerous('a.ts', 'const total = price * quantity;'), [])
})

test('scanSize: flags an oversized file', () => {
  const [finding] = scanSize('big.ts', 'x\n'.repeat(401))
  assert.ok(finding)
  assert.match(finding.message, /consider splitting/)
})

test('runGuardsOnContent: combines all guards', () => {
  const findings = runGuardsOnContent('a.ts', AWS_SAMPLE)
  assert.ok(findings.some((f) => f.guard === 'secrets'))
})

test('self-check: Keystone passes its own guards', async () => {
  const findings = await checkProject('src')
  assert.deepEqual(findings, [], `unexpected findings: ${JSON.stringify(findings, null, 2)}`)
})
