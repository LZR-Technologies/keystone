// Workflow files every project is born with: a task board and a contributing
// guide describing the three levels and the review gate. See docs/fluxo-trabalho.md.

import type { ProductBriefing } from '../types.ts';
import type { ScaffoldFile } from './foundation.ts';

function taskBoard(name: string): string {
  return `# ${name} — Tasks

A simple board. Move items down as they progress.

## To do

## Doing

## Done
`;
}

function contributing(name: string): string {
  return `# Contributing to ${name}

## Three levels

- **official** — what is live / done. Never edited directly.
- **staging** — what is being integrated.
- **working** — your day-to-day branch, one per independent piece of work.

## The review gate

Every change goes through a review before reaching the official version — even when
working alone. The automated guards (formatting, errors, exposed secrets, tests) run
on the way in; only what passes can be approved and merged.

If this project is open to the community, the same gate receives outside proposals:
a contribution is made on a separate copy, runs through the guards, and only what
passes reaches a maintainer, who has the final say. Nothing lands unreviewed.

Every delivery records its author.
`;
}

export function workflowFiles(product: ProductBriefing): ScaffoldFile[] {
  return [
    { path: 'TASKS.md', content: taskBoard(product.name) },
    { path: 'CONTRIBUTING.md', content: contributing(product.name) },
  ];
}
