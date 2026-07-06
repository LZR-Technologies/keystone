// Tests for the non-interactive flag parser: it either returns a full, valid answer set or throws a
// clear error — it never silently falls back to asking.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { answersFromFlags } from '../src/answers-from-flags.ts'

test('answersFromFlags: no --type returns null (falls through to the wizard)', () => {
  assert.equal(answersFromFlags([], 'my-app'), null)
  assert.equal(answersFromFlags(['--no-install'], 'my-app'), null)
})

test('answersFromFlags: a full multi-tenant system maps every flag', () => {
  const answers = answersFromFlags(
    [
      '--type',
      'system',
      '--language',
      'pt',
      '--screen',
      'desktop',
      '--sensitive',
      'no',
      '--multi-tenant',
      'yes',
      '--super-admin',
      'yes',
      '--audit-log',
      'no',
      '--version-target',
      'github',
      '--private',
      'yes',
      '--dir',
      'C:\\work',
    ],
    'lzr-optograph',
  )
  assert.deepEqual(answers, {
    product: {
      name: 'lzr-optograph',
      type: 'system',
      language: 'pt',
      screen: 'desktop',
      sensitive: false,
      multiTenant: true,
      superAdmin: true,
      auditLog: false,
    },
    setup: { versionTarget: 'github', isPrivate: true, parentDir: 'C:\\work' },
  })
})

test('answersFromFlags: a plain site omits the multi-tenant fields (never asked)', () => {
  const answers = answersFromFlags(
    [
      '--type',
      'site',
      '--language',
      'en',
      '--screen',
      'both',
      '--sensitive',
      'no',
      '--version-target',
      'local',
      '--private',
      'no',
      '--dir',
      '/sites',
    ],
    'brochure',
  )
  assert(answers)
  assert.equal(answers.product.type, 'site')
  assert.equal('multiTenant' in answers.product, false)
  assert.equal('superAdmin' in answers.product, false)
})

test('answersFromFlags: a single-tenant system omits super-admin and audit', () => {
  const answers = answersFromFlags(
    [
      '--type',
      'service',
      '--language',
      'en',
      '--screen',
      'both',
      '--sensitive',
      'yes',
      '--multi-tenant',
      'no',
      '--version-target',
      'github',
      '--private',
      'no',
      '--dir',
      '/x',
    ],
    'svc',
  )
  assert(answers)
  assert.equal(answers.product.multiTenant, false)
  assert.equal('superAdmin' in answers.product, false)
  assert.equal('auditLog' in answers.product, false)
})

test('answersFromFlags: supports the --flag=value form', () => {
  const answers = answersFromFlags(
    [
      '--type=site',
      '--language=pt',
      '--screen=mobile',
      '--sensitive=no',
      '--version-target=local',
      '--private=no',
      '--dir=/s',
    ],
    'x',
  )
  assert(answers)
  assert.equal(answers.product.screen, 'mobile')
})

test('answersFromFlags: a missing required flag throws, naming it', () => {
  assert.throws(() => answersFromFlags(['--type', 'site', '--language', 'pt'], 'x'), /--screen/)
})

test('answersFromFlags: an invalid enum value throws, naming the flag and options', () => {
  assert.throws(
    () =>
      answersFromFlags(
        [
          '--type',
          'system',
          '--language',
          'pt',
          '--screen',
          'sideways',
          '--sensitive',
          'no',
          '--multi-tenant',
          'no',
          '--version-target',
          'github',
          '--private',
          'no',
          '--dir',
          '/x',
        ],
        'x',
      ),
    /--screen must be one of/,
  )
})

test('answersFromFlags: a non yes/no boolean throws', () => {
  assert.throws(
    () =>
      answersFromFlags(
        [
          '--type',
          'site',
          '--language',
          'pt',
          '--screen',
          'both',
          '--sensitive',
          'maybe',
          '--version-target',
          'local',
          '--private',
          'no',
          '--dir',
          '/x',
        ],
        'x',
      ),
    /--sensitive must be "yes" or "no"/,
  )
})

test('answersFromFlags: --type without a name throws', () => {
  assert.throws(() => answersFromFlags(['--type', 'site'], undefined), /project name is required/)
})
