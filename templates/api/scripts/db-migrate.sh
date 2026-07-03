#!/bin/sh
# db-migrate.sh - applies db/migrations/NNNN_*.sql in filename order via psql.
#
# The apply loop only matches the documented NNNN_short_description.sql
# convention (db/migrations/README.md), so a non-.sql file (README.md) is
# never picked up and "applied" by accident. But a stray *.sql file that
# breaks the naming convention is a different hazard: it would run neither, and
# silently skipping it means a "green" deploy on an incomplete schema. Before
# applying anything, this script scans for such files and FAILS LOUDLY rather
# than skip them in silence (see the pre-apply guard below).
#
# Idempotent: applied filenames are recorded in a schema_migrations table and
# skipped on subsequent runs, so this script is safe to run on every deploy.
#
# POSIX sh on purpose: this must run identically on a developer laptop, a CI
# runner, and a bare container without bash installed.
#
# Usage:
#   DATABASE_URL=postgres://user:pass@host:5432/db sh scripts/db-migrate.sh

set -eu

# Fail fast with a human-readable message: a missing DATABASE_URL otherwise
# surfaces as a cryptic psql connection error deep in the loop.
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "Set it to a Postgres connection string, e.g.:" >&2
  echo "  export DATABASE_URL=postgres://user:pass@host:5432/dbname" >&2
  exit 1
fi

if ! command -v psql > /dev/null 2>&1; then
  echo "ERROR: psql not found on PATH. Install the Postgres client tools." >&2
  exit 1
fi

# Resolve the migrations directory relative to this script, so the script
# works no matter which directory it is invoked from.
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
MIGRATIONS_DIR="$SCRIPT_DIR/../db/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "ERROR: migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

# Guard before touching the database: a .sql file that does NOT match the
# NNNN_*.sql convention would be skipped silently by the apply loop below,
# producing a "green" deploy on an INCOMPLETE schema (e.g. someone drops
# 002_x.sql or add_column.sql without the four-digit prefix - it just never
# runs, and no one is told). A missed migration is a correctness bug, not a
# formatting nit, so we refuse to guess: list every offending file and fail
# loudly BEFORE opening any DB connection. The operator either renames it to
# the convention (so it runs, in order) or removes it. The README.md beside the
# migrations is not .sql, so it is not a candidate here.
unconventional=""
for sql in "$MIGRATIONS_DIR"/*.sql; do
  # When the glob matches nothing, sh leaves the pattern literal - skip it.
  [ -e "$sql" ] || continue

  sql_name=$(basename "$sql")

  # Re-test the same convention the apply loop uses. `case` is POSIX and does
  # glob matching without spawning a subprocess per file.
  case "$sql_name" in
    [0-9][0-9][0-9][0-9]_*.sql) ;; # matches the convention - will be applied
    *) unconventional="$unconventional  $sql_name\n" ;;
  esac
done

if [ -n "$unconventional" ]; then
  echo "ERROR: found .sql file(s) in $MIGRATIONS_DIR that do NOT match the" >&2
  echo "NNNN_short_description.sql convention and would be SKIPPED SILENTLY:" >&2
  # printf (not echo -e) to expand the \n portably across POSIX shells.
  printf "%b" "$unconventional" >&2
  echo "Rename each to the numbered convention so it is applied in order, or" >&2
  echo "remove it. Refusing to deploy on a possibly incomplete schema." >&2
  exit 1
fi

# Tracking table. "filename" as the primary key keeps the model dead simple:
# a file is either applied (row exists) or not.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "
  create table if not exists schema_migrations (
    filename   text primary key,
    applied_at timestamptz not null default now()
  );
"

applied_count=0
skipped_count=0

# POSIX glob expansion sorts lexicographically, which is exactly the NNNN_
# ordering convention - no extra sort needed. The [0-9][0-9][0-9][0-9]_
# prefix restricts the match to the documented naming convention (see the
# header comment above and db/migrations/README.md).
for file in "$MIGRATIONS_DIR"/[0-9][0-9][0-9][0-9]_*.sql; do
  # When the glob matches nothing, sh leaves the pattern literal.
  if [ ! -e "$file" ]; then
    echo "No migration files found in $MIGRATIONS_DIR - nothing to do."
    exit 0
  fi

  name=$(basename "$file")

  already=$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tA \
    -c "select 1 from schema_migrations where filename = '$name'")

  if [ "$already" = "1" ]; then
    echo "SKIP  $name (already applied)"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  echo "APPLY $name"
  # --single-transaction wraps the file AND the tracking insert in ONE
  # transaction: either the migration applies and is recorded, or neither
  # happens. A crash can never leave an applied-but-unrecorded migration.
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction \
    -f "$file" \
    -c "insert into schema_migrations (filename) values ('$name')"

  applied_count=$((applied_count + 1))
done

echo "Done. Applied: $applied_count, skipped: $skipped_count."
