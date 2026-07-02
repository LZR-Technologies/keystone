# Database migrations

Plain SQL migrations applied in order by `scripts/db-migrate.sh`. No ORM, no
DSL: what you read is exactly what runs against the database.

## Naming and ordering

```
db/migrations/
└── 0001_initial_schema.sql
    0002_add_items_status.sql   <- next one would look like this
```

- **`NNNN_short_description.sql`** -- a zero-padded sequence number plus a short
  snake_case description. The number defines the order; the description makes
  `ls` readable.
- **Ordered and append-only.** New changes are ALWAYS a new file with the next
  number. Never edit a migration that has been applied anywhere: the tracking
  table records only the filename, so an edited file would silently diverge
  between databases that applied the old and the new content.
- **One concern per migration.** A reviewer (and a rollback plan) should be able
  to hold the whole change in their head.

## How tracking works

`scripts/db-migrate.sh` maintains a `schema_migrations` table (created on first
run) recording each applied filename. On every run it applies, in order, only
the files not yet recorded -- so the script is idempotent and safe to run on
every deploy. Each migration and its tracking record are committed in a single
transaction: a failed migration leaves no half-applied state and no false
"applied" record.

## Running

```sh
# DATABASE_URL is required -- the script fails fast without it.
DATABASE_URL=postgres://user:pass@host:5432/db sh scripts/db-migrate.sh
```

In CI/CD the deploy workflows run this against the target environment's
database (see `docs/deploy.md`), using the `DATABASE_URL` secret of the GitHub
Environment.

## Migration before code

The schema change is applied to the target database **before** the code that
depends on it deploys (the deploy workflows order the jobs this way). Old code
must keep working against the new schema, which in practice means:

1. Ship additive changes first (new nullable column, new table).
2. Deploy the code that uses them.
3. Only after nothing references the old shape, ship a destructive cleanup
   migration (drop/rename).

## Conventions (established in `0001_initial_schema.sql`)

| Convention                                   | Why                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `snake_case` identifiers                     | PostgreSQL folds unquoted identifiers to lowercase; camelCase would force quoting everywhere. TypeScript uses camelCase -- the mapping happens once, at the data-access layer. |
| `uuid` PK, `DEFAULT gen_random_uuid()`       | No central sequence, non-guessable in URLs, merge-friendly across environments. Core function since PostgreSQL 13 -- no extension required.                                    |
| `tenant_id` on every business table          | The tenant column row level security anchors on. A table without it cannot hold tenant data.                                                                                   |
| `created_at` / `updated_at` (timestamptz)    | Audit trail; `updated_at` is kept fresh by a trigger so no write path can forget it.                                                                                           |
| `deleted_at` soft delete                     | Rows are marked, never destroyed -- history survives, mistakes are recoverable. Queries filter `WHERE deleted_at IS NULL`.                                                     |
| ROW LEVEL SECURITY + tenant-isolation policy | The database refuses to leak cross-tenant rows even if application code forgets a `WHERE`. Fail closed: an unconfigured connection sees zero rows.                             |
