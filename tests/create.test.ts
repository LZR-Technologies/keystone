// Tests for the deterministic core: deduction + project creation (base mould).
// Born with the feature, covers the happy path and the edges (the pillar of Testes).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deduce, createProject } from '../src/create.ts';
import type { KeystoneAnswers, ProjectType } from '../src/types.ts';

function answers(type: ProjectType, sensitive: boolean, parentDir = '.'): KeystoneAnswers {
  return {
    product: { name: 'demo', type, language: 'pt', screen: 'both', look: 'later', sensitive },
    setup: { versionTarget: 'local', isPrivate: false, parentDir },
  };
}

test('deduce: a site needs no database and is essential security', () => {
  const d = deduce(answers('site', false));
  assert.equal(d.needsDatabase, false);
  assert.equal(d.securityLevel, 'essential');
});

test('deduce: a system needs a database', () => {
  assert.equal(deduce(answers('system', false)).needsDatabase, true);
});

test('deduce: sensitive raises security to reinforced', () => {
  assert.equal(deduce(answers('site', true)).securityLevel, 'reinforced');
});

test('deduce: mobile needs a database only when sensitive', () => {
  assert.equal(deduce(answers('mobile', false)).needsDatabase, false);
  assert.equal(deduce(answers('mobile', true)).needsDatabase, true);
});

test('createProject: writes the base mould and foundation files', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'keystone-'));
  try {
    const { projectDir, deduced, files } = await createProject(answers('system', true, parent));

    assert.ok((await stat(projectDir)).isDirectory());

    // config records the answers and deductions
    const config = JSON.parse(await readFile(join(projectDir, 'keystone.json'), 'utf8'));
    assert.equal(config.product.name, 'demo');
    assert.equal(config.deduced.needsDatabase, true);
    assert.equal(deduced.securityLevel, 'reinforced');

    // the base mould + foundation are present
    for (const expected of ['package.json', 'README.md', '.gitignore', 'src/lib/format.ts', 'src/lib/i18n.ts']) {
      assert.ok(files.includes(expected), `expected ${expected} to be written`);
      assert.ok((await stat(join(projectDir, expected))).isFile());
    }

    // the foundation is in the project's language
    const format = await readFile(join(projectDir, 'src/lib/format.ts'), 'utf8');
    assert.match(format, /pt-BR/);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
