// Tests for the wizard flow, using a scripted prompter (no terminal, no piping).
// Proves the questions map to the right answers — the happy path and the order.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runWizard } from '../src/wizard.ts'
import { ScriptedPrompter } from '../src/prompter.ts'

test('runWizard: maps choices to the right answers (with preset name)', async () => {
  // type, language, screen, look, sensitive, version, visibility, parentDir
  const prompter = new ScriptedPrompter(['2', '1', '2', '1', '1', '1', '2', '/work'])
  const answers = await runWizard(prompter, 'my-app')

  assert.deepEqual(answers, {
    product: {
      name: 'my-app',
      type: 'system',
      language: 'pt',
      screen: 'desktop',
      look: 'generate',
      sensitive: true,
    },
    setup: {
      versionTarget: 'github',
      isPrivate: true,
      parentDir: '/work',
    },
  })
})

test('runWizard: asks for the name when no preset is given', async () => {
  // name, type, language, screen, look, sensitive, version, visibility, parentDir
  const prompter = new ScriptedPrompter(['blog', '1', '2', '1', '3', '2', '3', '1', '/sites'])
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

test('runWizard: rejects an invalid project name before asking anything else', async () => {
  // A preset name with a space + uppercase is invalid. The wizard must reject it immediately,
  // never consuming the (empty) answer list — proof it fails before the questionnaire.
  const prompter = new ScriptedPrompter([])
  await assert.rejects(() => runWizard(prompter, 'My App'), /Invalid project name/)
})

test('runWizard: a valid name passes the early name check', async () => {
  // type, language, screen, look, sensitive, version, visibility, parentDir — all valid.
  const prompter = new ScriptedPrompter(['1', '2', '1', '3', '2', '3', '1', '/sites'])
  const answers = await runWizard(prompter, 'my-app')
  assert.equal(answers.product.name, 'my-app')
})

test('runWizard: warns about mobile the moment it is chosen, not after the whole briefing', async () => {
  // Only two answers are scripted: the name is a preset, and "4" picks mobile. If the wizard
  // asked the remaining questions it would run out of answers with a different error; instead
  // it must stop with the clear "no template" message right after the type is chosen.
  const prompter = new ScriptedPrompter(['4'])
  await assert.rejects(() => runWizard(prompter, 'my-app'), /no template for a "mobile"/)
})
