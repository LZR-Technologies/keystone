// Creating the project: the deterministic part. Runs on its own, no AI, zero cost.
// Step 2 lays down the base mould — the standard folder layout plus the foundation
// files (translation hub + locale-aware formatting). Later steps add the other
// pillars. See docs/plano-construcao.md and docs/fundacao.md.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { KeystoneAnswers, ProjectType } from './types.ts';
import { foundationFiles, type ScaffoldFile } from './scaffold/foundation.ts';
import { databaseFiles } from './scaffold/database.ts';
import { workflowFiles } from './scaffold/workflow.ts';

export interface DeducedChoices {
  needsDatabase: boolean;
  securityLevel: 'essential' | 'reinforced';
}

/**
 * Decide what the skill can figure out from what the user already said —
 * never asked. A site needs no database; a system/service does; mobile only
 * when it also handles sensitive data. Sensitive data raises the security level.
 * See docs/wizard-inicial.md ("type 2" decisions) and docs/banco-dados.md.
 */
export function deduce(answers: KeystoneAnswers): DeducedChoices {
  const { type, sensitive } = answers.product;
  const dataBackedTypes: ProjectType[] = ['system', 'service'];
  const needsDatabase = dataBackedTypes.includes(type) || (type === 'mobile' && sensitive);
  return {
    needsDatabase,
    securityLevel: sensitive ? 'reinforced' : 'essential',
  };
}

/** The base files every project gets, regardless of type. */
function baseFiles(answers: KeystoneAnswers, deduced: DeducedChoices): ScaffoldFile[] {
  const { product, setup } = answers;

  // Records answers + deductions so later steps (and re-runs) know how this
  // project was set up, instead of guessing.
  const config = { keystoneVersion: '0.1.0', product, setup, deduced };

  // A minimal manifest for the generated project; the real stack is layered later.
  const manifest = { name: product.name, version: '0.1.0', private: true, type: 'module' };

  return [
    { path: 'keystone.json', content: `${JSON.stringify(config, null, 2)}\n` },
    { path: 'package.json', content: `${JSON.stringify(manifest, null, 2)}\n` },
    { path: 'README.md', content: `# ${product.name}\n\nCreated with Keystone.\n` },
    { path: '.gitignore', content: 'node_modules/\ndist/\n.env\n.env.local\n' },
  ];
}

/** Write a list of scaffold files under the project dir, creating subfolders. */
async function writeFiles(projectDir: string, files: ScaffoldFile[]): Promise<void> {
  for (const file of files) {
    const full = join(projectDir, file.path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, file.content);
  }
}

export interface CreateResult {
  projectDir: string;
  deduced: DeducedChoices;
  /** Paths written, relative to the project root — useful for the confirmation. */
  files: string[];
}

/** Create the project folder and its base mould from the collected answers. */
export async function createProject(answers: KeystoneAnswers): Promise<CreateResult> {
  const deduced = deduce(answers);
  const projectDir = resolve(answers.setup.parentDir, answers.product.name);

  const files = [
    ...baseFiles(answers, deduced),
    ...foundationFiles(answers.product),
    ...databaseFiles(answers.product, deduced.needsDatabase),
    ...workflowFiles(answers.product),
  ];
  await writeFiles(projectDir, files);

  return { projectDir, deduced, files: files.map((f) => f.path) };
}
