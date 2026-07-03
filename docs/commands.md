# Project-creation flow — end to end

> **What this is:** the sequence the `create a new project` command runs, from the initial
> command to a project folder on disk. It also describes the setup decisions the command records
> and the many pieces that are still the standard the scaffold aims for, not delivered behavior.
> See [pillars.md](pillars.md) and [setup-wizard.md](setup-wizard.md).
>
> **Status:** the `create a new project` command copies the official template (web or api) into a new
> folder, lays the agent harness on top, renames the package, writes a `keystone.json` record, and
> deduces two settings (whether a database is needed, and the security level) from the answers. It
> then takes the project the last mile: it **starts version control with a first commit, installs
> dependencies, and — through that install — switches on the git hooks** (`--no-git` / `--no-install`
> skip these). It still **does not** create a remote repository, push, provision or connect a
> database, store a service key, run migrations, or run the guided design step — those remain
> **planned** and are flagged inline below. Creating a remote repo or a hosting account stays the
> owner's, by design.

---

## Step 0 — Start

Run the command from anywhere. **No folder or repository needs to exist first.**

## Step 1 — Round A: product briefing (minimal wizard)

Questions, one at a time:

1. Project name
2. Project type
3. Starting language
4. Screen priority (mobile / desktop / both)
5. Visual identity → **guided design step** _(planned)_ · **import an existing design** _(planned)_ ·
   **decide later**
6. Does it handle sensitive data or money?

## Step 2 — Round B: technical setup

- Where to version (with a cloud remote, or local-only) — recorded as a preference; the command
  does **not** create or connect a repository (see Step 4)
- Visibility (public / private) — recorded, not applied
- Parent folder (where on the machine to create the project folder)

## Step 3 — Deductions (decided automatically, not asked)

- **Needs a database?** — inferred from project type + sensitivity, and recorded
- **Security level** — essential, or reinforced if sensitive, and recorded
- **Visual foundation** — fonts, spacing, accessibility, locale formatting: these live in the template,
  so every copied project starts with them in place

## Step 4 — Creation (what the command actually does)

The command:

1. **Copies the project folder** into the parent folder — a byte-for-byte copy of the official
   template (web or api), skipping installed dependencies.
2. **Renames the package** — changes only the `name` in `package.json` to the project name.
3. **Writes a record** (`keystone.json`) noting the template used, the answers, and the deductions.
4. **Deduces two settings** (database needed?, security level) and stores them in that record.
5. **Starts version control** — `git init -b main` (the protected branch is pinned, never the
   machine default), stages the files, makes a first scoped conventional commit on `main`, then
   creates and checks out `develop` — because `main` is protected by the template's own guards,
   daily work belongs on the integration level, and without this the developer's next commit would
   be blocked by the project's own guardrail. The commit happens _before_ install, so the baseline
   is never blocked by hooks that install has not switched on yet. Skipped by `--no-git`.
6. **Installs dependencies** with the template's package manager (detected from its lockfile), which
   runs the `prepare` script and thereby **switches on the git hooks**. Skipped by `--no-install`.

Beyond that, in particular:

- **Remote repository.** _Planned / by design left to the owner._ The command initializes git
  locally and commits, but does **not** create a remote repository or push anywhere — and it never
  creates a third-party account. The "where to version" answer is recorded for that later step.
- **Three version levels** (trunk / staging / working), the review gate, and the protection
  rules on the protected branch. _Planned._ These are the standard the scaffold aims for — not built.
- **Standard organization** — the task board and session hand-off (close a session / resume it, plus
  a daily log and a hand-off record). _Planned._ None of these run today, and the folders that would
  hold them are not created as working behavior.
- **Database.** _Planned._ The command does **not** provision a database, connect one, store or
  reuse a service key, or run migrations. When a database is inferred, that fact is only recorded in
  `keystone.json`; setting it up is left to the developer.
- **Visual identity.** _Planned._ The guided design step and the import-an-existing-design path are
  not built. Every project simply starts with the template's default look and its visual foundation
  (fonts, spacing, accessibility, locale formatting), which ship inside the template.
- **Deploy / hosting.** _Planned._ The delivery pipeline, the staging environment, and the automated
  deploy are the standard the scaffold aims for — not built. The template **contains** the
  delivery-pipeline files, but the command does not wire up or trigger any deploy. Deploy and hosting
  are entirely up to the developer, who decides where and how to host.
- **Automatic checks** (quality, tests, security). The template **contains** them: the git hooks
  (a pre-commit that runs the staged-file linter, a commit-msg check, and a pre-push that runs the
  type-check and the tests), the lint / format / type configs, and example end-to-end tests are all
  present in the copied folder. The install step (step 6) now **activates the git hooks** via the
  `prepare` script, so they guard every commit from the first one after creation. Separately, the
  `check` command runs those same tools on demand as blocking project gates (see
  [code-quality.md](code-quality.md), [tests.md](tests.md), [security.md](security.md)). _Planned:_
  wiring that gate to run automatically at publish time remains the standard the scaffold aims for.

## Step 5 — Final confirmation

A summary of what was created: the local folder (a renamed copy of the template), the recorded
answers and deductions, whether a database was inferred as needed, and the outcome of each
post-create step (version control, install) — reported honestly, so a step that failed is never
silent. No **remote** repository, database, or deploy exists yet; those are the developer's to set
up.

---

## Principles the flow honors

- **Only asks about taste** (the user's own preferences); infers the project shape; and copies a
  foundation that already carries the standard files. See [setup-wizard.md](setup-wizard.md).
- **Runs on its own, at zero AI cost.** The command today uses no AI at all — it copies, renames,
  and records. AI would enter only in the optional design step, which is planned, not built.
- **Secrets out of the code.** The intended design keeps service keys in the user's environment,
  reusable — but the command does not yet take, store, or use any key.
- **The command never creates a third-party account** (database, hosting) — that stays the user's.
  Today the command does not touch third-party services at all.
