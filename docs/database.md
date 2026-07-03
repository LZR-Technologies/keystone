# Database pillar — full rule

> The full rule behind the Database pillar. Blueprint in [pillars.md](pillars.md).
> How setup handles the database in [setup-wizard.md](setup-wizard.md). 🔧 = automatic check that
> runs today.
>
> **Build status:** Only three commands exist today — `new` (scaffolds a project), `check`, and
> `analyze`. `check` runs three text guards (exposed secrets, oversized files, dangerous patterns)
> plus the project's own gates (format, lint, types, tests, dependency audit); the database-specific
> checks named on this page are still the target, not built. `analyze` is read-only and runs exactly
> six presence checks (exposed secrets, .gitignore
> completeness, presence of tests, presence of a README, basic text checks over `.sql` files, and
> oversized files). Everything else on this page — including the tenant-filter query check — is the
> **target**, not yet built. Planned items are marked "planned" below and never carry the 🔧 symbol.

## Principle

The data store starts organized, traceable, and secure by default. Structural
changes are always recorded; nothing is truly lost.

## 1. Timestamp everything

- Every record carries a **created and last-updated timestamp** from the moment it exists. This
  makes it possible to audit, sort, and answer "when did this change?".

## 2. Delete means hide, not disappear

- When something is "deleted", it **leaves the view but stays stored** — it can be recovered and
  audited. This is soft delete.
- It protects against human error and fraud. (A true, permanent delete is a rare and deliberate
  exception.)

## 3. Every structural change is recorded

- Every change to the database structure is applied through **recorded, repeatable steps**
  (migrations), identical across every environment. Nobody edits the database directly.
- These run through the database service's own tooling — **no AI, zero cost**.

## 4. Non-sequential identifiers (UUIDs)

- Each record has a **non-sequential identifier (UUID)** (not a sequential 1, 2, 3). Nobody can count how many
  records exist or probe the data by walking the numbers.

## 5. Every record carries the tenant id

- Every record carries the **owning tenant's id**, and that separation is enforced in the database.
  This is tenant isolation.
- It is the foundation of the Security pillar's application-layer security (the core) — see [security.md](security.md),
  item 1.1.
- **Planned:** an automatic check that flags a query that runs without the tenant filter. This check
  is a target and is **not built yet** — it does not run today.

## 6. Internal names in English

- Internal names for the data are always in **English** (the international standard). The screen stays
  in the user's language; only the engine is in English.

## Database need (inferred)

Setup **infers** whether the project needs a database (from type and data sensitivity), so it does
not ask. _Planned:_ provisioning or connecting the database automatically. See [setup-wizard.md](setup-wizard.md).
