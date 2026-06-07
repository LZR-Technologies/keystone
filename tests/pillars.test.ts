// Tests for Step 4 — pillars in the mould: database (conditional) and workflow.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { databaseFiles } from '../src/scaffold/database.ts';
import { workflowFiles } from '../src/scaffold/workflow.ts';
import type { ProductBriefing } from '../src/types.ts';

const product: ProductBriefing = {
  name: 'shop',
  type: 'system',
  language: 'pt',
  screen: 'both',
  look: 'later',
  sensitive: true,
};

test('databaseFiles: none when the project does not need a database', () => {
  assert.deepEqual(databaseFiles(product, false), []);
});

test('databaseFiles: generates a first migration with the four conventions', () => {
  const files = databaseFiles(product, true);
  assert.deepEqual(
    files.map((f) => f.path),
    ['db/migrations/0001_init.sql', 'db/README.md'],
  );
  const sql = files[0].content;
  assert.match(sql, /gen_random_uuid\(\)/); // unguessable id
  assert.match(sql, /owner_id/); // client separation
  assert.match(sql, /created_at/); // stamps
  assert.match(sql, /deleted_at/); // soft delete
});

test('workflowFiles: generates the board and the contributing guide', () => {
  const files = workflowFiles(product);
  assert.deepEqual(
    files.map((f) => f.path),
    ['TASKS.md', 'CONTRIBUTING.md'],
  );
  assert.match(files[0].content, /To do/);
  assert.match(files[1].content, /review gate/);
});
