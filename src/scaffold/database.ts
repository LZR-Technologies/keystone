// Database foundation, generated only when the project needs a database
// (deduced from type + sensitivity). The first migration already encodes the
// conventions every table must follow. See docs/banco-dados.md.

import type { ProductBriefing } from '../types.ts';
import type { ScaffoldFile } from './foundation.ts';

function initMigration(): string {
  return `-- Migration 0001 — initial structure.
-- Conventions Keystone enforces on every table (see docs/banco-dados.md):
--   * id: unguessable (uuid), never a sequential 1, 2, 3
--   * owner_id: the client's tag — keeps each client's data separate
--   * created_at / updated_at: stamps on everything
--   * deleted_at: soft delete — nothing truly disappears, it can be recovered
--
-- Structure changes are always made as numbered, repeatable migrations like this
-- one — never by hand directly. The next change is 0002_*.sql, and so on.

create extension if not exists "pgcrypto";

-- Example table. Replace with your real tables, keeping the four conventions.
create table example (
  id          uuid        primary key default gen_random_uuid(),
  owner_id    uuid        not null,
  -- your columns here --
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- Separation lives in the database, not only in app code: every query must
-- filter by owner_id. Enable row-level security and add an owner policy when
-- your platform supports it.
`;
}

function dbReadme(): string {
  return `# Database

Every table follows four conventions, enforced from day one:

- **Unguessable id** — \`uuid\`, never sequential.
- **Owner tag** — \`owner_id\` keeps each client's data separate. Every query filters by it.
- **Stamps** — \`created_at\` / \`updated_at\` on everything.
- **Soft delete** — \`deleted_at\`; nothing truly disappears, it can be recovered.

Structure changes are numbered, repeatable migrations under \`db/migrations/\` — never
made by hand. Run them with your database's official tooling (no AI, zero cost).
`;
}

/** The database files, or none if the project does not need a database. */
export function databaseFiles(_product: ProductBriefing, needsDatabase: boolean): ScaffoldFile[] {
  if (!needsDatabase) return [];
  return [
    { path: 'db/migrations/0001_init.sql', content: initMigration() },
    { path: 'db/README.md', content: dbReadme() },
  ];
}
