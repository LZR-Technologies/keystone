// Tests for the wizard flow, using a scripted prompter (no terminal, no piping).
// Proves the questions map to the right answers — the happy path and the order.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runWizard } from '../src/wizard.ts'
import { ScriptedPrompter } from '../src/prompter.ts'

test('runWizard: maps choices to the right answers (with preset name)', async () => {
  // type, language, screen, sensitive, multiTenant=yes, superAdmin=yes, auditLog=yes,
  // version, visibility, parentDir. A "system" is database-backed and multi-tenant, so the
  // super-admin and audit-log questions are both asked.
  const prompter = new ScriptedPrompter(['2', '1', '2', '1', '1', '1', '1', '1', '2', '/work'])
  const answers = await runWizard(prompter, 'my-app')

  assert.deepEqual(answers, {
    product: {
      name: 'my-app',
      type: 'system',
      language: 'pt',
      screen: 'desktop',
      sensitive: true,
      multiTenant: true,
      superAdmin: true,
      auditLog: true,
    },
    setup: {
      versionTarget: 'github',
      isPrivate: true,
      parentDir: '/work',
    },
  })
})

test('runWizard: super-admin and audit are asked (and independent) inside multi-tenant', async () => {
  // type=system, lang, screen, sensitive, multiTenant=yes, superAdmin=yes(1), auditLog=no(2),
  // version, visibility, parentDir. Proves the two are independent questions, not a bundle.
  const prompter = new ScriptedPrompter(['2', '2', '2', '2', '1', '1', '2', '1', '1', '/work'])
  const answers = await runWizard(prompter, 'my-app')
  assert.equal(answers.product.multiTenant, true)
  assert.equal(answers.product.superAdmin, true)
  assert.equal(answers.product.auditLog, false)
})

test('runWizard: single-tenant skips super-admin and audit entirely', async () => {
  // type=service, language, screen, sensitive, multiTenant=no(2), version, visibility, parentDir.
  // Only 8 answers scripted: if super-admin/audit were asked, the list would run out.
  const prompter = new ScriptedPrompter(['3', '2', '2', '2', '2', '1', '1', '/work'])
  const answers = await runWizard(prompter, 'my-svc')
  assert.equal(answers.product.type, 'service')
  assert.equal(answers.product.multiTenant, false)
  assert.equal(answers.product.superAdmin, undefined)
  assert.equal(answers.product.auditLog, undefined)
})

test('runWizard: does NOT ask multi-tenant for a plain site (no database)', async () => {
  // A site has no database, so the multi-tenant question must be skipped. Only the
  // site's own questions are scripted; a stray extra question would run past the list.
  // name(preset), type=site(1), language, screen, sensitive, version, visibility, parentDir
  const prompter = new ScriptedPrompter(['1', '2', '1', '2', '3', '1', '/sites'])
  const answers = await runWizard(prompter, 'brochure')
  assert.equal(answers.product.type, 'site')
  assert.equal(answers.product.multiTenant, undefined)
})

test('runWizard: asks for the name when no preset is given', async () => {
  // name, type, language, screen, sensitive, version, visibility, parentDir
  const prompter = new ScriptedPrompter(['blog', '1', '2', '1', '2', '3', '1', '/sites'])
  const answers = await runWizard(prompter)

  assert.equal(answers.product.name, 'blog')
  assert.equal(answers.product.type, 'site')
  assert.equal(answers.product.sensitive, false)
  assert.equal(answers.setup.versionTarget, 'local')
  assert.equal(answers.setup.isPrivate, false)
})

test('runWizard: rejects an out-of-range scripted answer', async () => {
  const prompter = new ScriptedPrompter(['9', '1', '1', '1', '1', '1', '1', '/x'])
  await assert.rejects(() => runWizard(prompter, 'x'), /out of range/)
})

test('runWizard: rejects a name that is invalid even after normalizing, before asking anything', async () => {
  // A leading dot survives normalizing (which only fixes case and spaces), so the name stays
  // invalid. The wizard must reject it immediately, never consuming the (empty) answer list —
  // proof it fails before the questionnaire.
  const prompter = new ScriptedPrompter([])
  await assert.rejects(() => runWizard(prompter, '.hidden'), /Invalid project name/)
})

test('runWizard: normalizes a human name (capitals, spaces) instead of rejecting it', async () => {
  // "My App" is not a valid npm name as typed, but normalizing fixes it to "my-app" — so the
  // wizard accepts it and the collected name is the normalized form.
  // type=site(1), language, screen, sensitive, version, visibility, parentDir.
  const prompter = new ScriptedPrompter(['1', '2', '1', '2', '3', '1', '/sites'])
  const answers = await runWizard(prompter, 'My App')
  assert.equal(answers.product.name, 'my-app')
  // The adjustment is surfaced to the user, mentioning the resulting name.
  assert.equal(prompter.notices.length, 1)
  assert.ok(
    prompter.notices.some((n) => n.includes('my-app')),
    'the notice should mention the resulting name',
  )
})

test('runWizard: a valid name passes the early check and emits no notice', async () => {
  // type, language, screen, sensitive, version, visibility, parentDir — all valid.
  const prompter = new ScriptedPrompter(['1', '2', '1', '2', '3', '1', '/sites'])
  const answers = await runWizard(prompter, 'my-app')
  assert.equal(answers.product.name, 'my-app')
  // Nothing was adjusted, so the user is not bothered with a notice.
  assert.deepEqual(prompter.notices, [])
})

test('runWizard: warns about mobile the moment it is chosen, not after the whole briefing', async () => {
  // Only two answers are scripted: the name is a preset, and "4" picks mobile. If the wizard
  // asked the remaining questions it would run out of answers with a different error; instead
  // it must stop with the clear "no template" message right after the type is chosen.
  const prompter = new ScriptedPrompter(['4'])
  await assert.rejects(() => runWizard(prompter, 'my-app'), /no template for a "mobile"/)
})
