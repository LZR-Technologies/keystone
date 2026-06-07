// Tests for the automated guards: secret detection, size, and self-governance.
//
// The sample secrets are assembled from parts so this test file does not itself
// trip the detector when Keystone scans its own project — the same root-cause fix
// used in the detector, not an exception.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanSecrets } from '../src/guards/secrets.ts';
import { scanSize } from '../src/guards/size.ts';
import { runGuardsOnContent, checkProject } from '../src/guards/runner.ts';

const AWS_SAMPLE = `const k = "${'AKIA' + 'ABCDEFGHIJKLMNOP'}";`;
const API_SAMPLE = `const apiKey = "${'abcdef1234567890'}";`;
const PRIVATE_KEY_SAMPLE = '-----BEGIN PRIVATE ' + 'KEY-----';

test('scanSecrets: flags an AWS access key', () => {
  const findings = scanSecrets('a.ts', AWS_SAMPLE);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /AWS/);
});

test('scanSecrets: flags an api key assignment', () => {
  assert.equal(scanSecrets('a.ts', API_SAMPLE).length, 1);
});

test('scanSecrets: flags a private key block', () => {
  assert.equal(scanSecrets('a.ts', PRIVATE_KEY_SAMPLE).length, 1);
});

test('scanSecrets: no false positive on clean code', () => {
  assert.deepEqual(scanSecrets('a.ts', 'const total = price * quantity;'), []);
});

test('scanSize: flags an oversized file', () => {
  const findings = scanSize('big.ts', 'x\n'.repeat(401));
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /consider splitting/);
});

test('runGuardsOnContent: combines all guards', () => {
  const findings = runGuardsOnContent('a.ts', AWS_SAMPLE);
  assert.ok(findings.some((f) => f.guard === 'secrets'));
});

test('self-check: Keystone passes its own guards', async () => {
  const findings = await checkProject('src');
  assert.deepEqual(findings, [], `unexpected findings: ${JSON.stringify(findings, null, 2)}`);
});
