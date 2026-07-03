// Tests for project creation: a project is born from the real template, renamed.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deduce, createProject, copyFilterFor, assertValidProjectName } from '../src/create.ts'
import type { KeystoneAnswers, ProjectType } from '../src/types.ts'

function answers(type: ProjectType, sensitive: boolean, parentDir = '.'): KeystoneAnswers {
  return {
    product: { name: 'demo-app', type, language: 'pt', screen: 'both', look: 'later', sensitive },
    setup: { versionTarget: 'local', isPrivate: false, parentDir },
  }
}

test('deduce: a site needs no database and is essential security', () => {
  const d = deduce(answers('site', false))
  assert.equal(d.needsDatabase, false)
  assert.equal(d.securityLevel, 'essential')
})

test('deduce: a service needs a database', () => {
  assert.equal(deduce(answers('service', false)).needsDatabase, true)
})

test('deduce: sensitive raises security to reinforced', () => {
  assert.equal(deduce(answers('site', true)).securityLevel, 'reinforced')
})

test('createProject: a service is born from the real api template, renamed', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
  try {
    const { projectDir, template } = await createProject(answers('service', true, parent))
    assert.equal(template, 'api')

    // the real template files are present (incl. the local config copy)
    for (const f of [
      'package.json',
      'tsconfig.json',
      'eslint.config.mjs',
      'src/index.ts',
      'config/eslint-config/index.mjs',
    ]) {
      assert.ok((await stat(join(projectDir, f))).isFile(), `expected ${f} to exist`)
    }

    // renamed to the project name
    const pkg = JSON.parse(await readFile(join(projectDir, 'package.json'), 'utf8'))
    assert.equal(pkg.name, 'demo-app')

    // build noise was not copied
    await assert.rejects(stat(join(projectDir, 'node_modules')))

    // the creation record is present
    const record = JSON.parse(await readFile(join(projectDir, 'keystone.json'), 'utf8'))
    assert.equal(record.template, 'api')
    assert.equal(record.deduced.securityLevel, 'reinforced')

    // the recorded keystoneVersion is read from the tool's own package.json, not hardcoded —
    // so it stays in sync with the real version on every bump.
    const toolPkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
    assert.equal(record.keystoneVersion, toolPkg.version)

    // the .gitignore is restored (templates ship it as `gitignore` because npm strips
    // the dotted name from a package; without the restore the project could not commit).
    assert.ok((await stat(join(projectDir, '.gitignore'))).isFile(), 'expected .gitignore restored')
    await assert.rejects(stat(join(projectDir, 'gitignore')), 'the un-dotted name is gone')
  } finally {
    await rm(parent, { recursive: true, force: true })
  }
})

test('createProject: refuses to scaffold over a non-empty destination', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
  try {
    // A folder the user already has files in — scaffolding over it would destroy them.
    const victim = join(parent, 'demo-app')
    await mkdir(victim, { recursive: true })
    await writeFile(join(victim, 'README.md'), '# my irreplaceable readme\n')
    await assert.rejects(
      () => createProject(answers('service', false, parent)),
      /already exists and is not empty/,
    )
    // The user's file is untouched.
    assert.match(await readFile(join(victim, 'README.md'), 'utf8'), /irreplaceable/)
  } finally {
    await rm(parent, { recursive: true, force: true })
  }
})

test('createProject: a site is born from the web template', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'keystone-'))
  try {
    const { template } = await createProject(answers('site', false, parent))
    assert.equal(template, 'web')
  } finally {
    await rm(parent, { recursive: true, force: true })
  }
})

test('createProject: mobile has no template yet', async () => {
  await assert.rejects(() => createProject(answers('mobile', false, '.')), /No template yet/)
})

test('createProject: rejects an invalid project name before touching the filesystem', async () => {
  // A name with a space + uppercase would produce an invalid npm manifest. createProject must
  // refuse it up front (parentDir '.' is never written to, proving no folder was created).
  const bad = answers('service', false, '.')
  bad.product.name = 'My App'
  await assert.rejects(() => createProject(bad), /Invalid project name/)
})

test('assertValidProjectName: accepts valid names and rejects invalid ones', () => {
  // Valid npm package names pass without throwing.
  for (const good of ['my-app', 'shop', 'api.v2', 'a_b', 'x1']) {
    assert.doesNotThrow(() => assertValidProjectName(good), `expected "${good}" to be valid`)
  }
  // Invalid names (space, uppercase, leading dot) are rejected with a clear message.
  for (const bad of ['My App', 'UPPER', '.hidden', 'has space', '']) {
    assert.throws(
      () => assertValidProjectName(bad),
      /Invalid project name/,
      `expected "${bad}" invalid`,
    )
  }
})

test('copyFilterFor: keeps template files even when the template lives under node_modules', () => {
  // The regression that broke installed use: an absolute-path check saw "node_modules"
  // in the install path and copied nothing. The filter must judge by the path relative
  // to the template root, so a package installed under node_modules still copies its files.
  const root = '/app/node_modules/keystone/templates/api'
  const keep = copyFilterFor(root)
  assert.equal(keep(root), true, 'the template root itself is copyable')
  assert.equal(keep(`${root}/package.json`), true, 'a template file is copyable')
  assert.equal(keep(`${root}/src/index.ts`), true, 'a nested template file is copyable')
  // Real nested dependency and build-output folders inside the template are still skipped,
  // so a stray local build never bloats a generated project.
  assert.equal(keep(`${root}/node_modules/left-pad/index.js`), false, 'nested deps are skipped')
  assert.equal(keep(`${root}/.next/static/chunk.js`), false, 'Next.js build output is skipped')
  assert.equal(keep(`${root}/dist/index.js`), false, 'compiled output is skipped')
  // Loose per-machine build caches must not leak into a generated project either.
  assert.equal(keep(`${root}/tsconfig.tsbuildinfo`), false, 'incremental build cache is skipped')
})
