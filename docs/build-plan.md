# Keystone — Build Plan

> **What this document is:** a **contributor roadmap** — the path from design (the documents in this
> folder) to working code. It describes the order in which the template itself is built, not how a
> finished product behaves for its users. See [pillars.md](pillars.md).
>
> **Status:** only three commands are built today — `new` (scaffolds a new project), `check`, and
> `analyze` (read-only). `check` runs three text guards (exposed secrets,
> oversized files, dangerous patterns) plus the project's own gates (format, lint, types, tests, and a
> dependency audit), blocking on failure. `analyze` runs exactly six read-only checks: exposed secrets, `.gitignore`
> completeness, presence of tests, presence of a README, basic database-convention text checks, and
> oversized files. Everything else named below — the rest of the automatic checks, the full template,
> the database/workflow/ship pillars, the publish-time gate, and the final proof — is a roadmap
> **target**, not a delivered feature. Each unbuilt stage is described as future work until it lands.

## Build decisions

- **Distribution:** an open, public template anyone can adopt as a common foundation. The source
  lives in a public repository.
- **Strategy:** build the whole thing before opening it to the public, but **internally in
  verifiable stages** — each stage tested before the next, so nothing is built blind. The public
  release happens only once everything passes.
- **First piece:** the scaffold that asks and creates.

## The stages (in order)

### Stage 1 — The scaffold that asks and creates — implemented

The main command plus its setup questionnaire (the minimal wizard), which creates the project folder
and its base structure. This is the spine; everything else hangs off it. See
[setup-wizard.md](setup-wizard.md).

### Stage 2 — The base project template — planned

The template meant to serve as the starting point, intended to carry the standard internal organization
and the locale behavior (dates, money, languages, responsiveness, accessibility). This is a design
target, not yet built. See [foundation.md](foundation.md).

### Stage 3 — The automatic checks — partially implemented

The pieces that run on their own and block. **Built today:** three guards — the exposed-secret
scan, the oversized-file check, and a dangerous-pattern scan (injection/XSS sinks) — wired into the
`check` command. **Planned (not yet built):** the rest of code quality (auto-format, blocking on
errors), the rest of security (dependencies with known flaws, tenant isolation, deeper taint
analysis), and tests (run and block). Also planned: running the guards again at publish time as a
second net. See [code-quality.md](code-quality.md), [security.md](security.md), [tests.md](tests.md).

### Stage 4 — The pillars realized in the template — planned

Aims to bring the remaining pillars into the template: the database (timestamps, soft delete,
non-sequential identifiers (UUIDs), tenant isolation), the three version-control levels, the task board, session
hand-off, and the delivery pipeline (with a staging rehearsal and fast rollback). These are design
targets for the scaffold, not yet built. See [database.md](database.md), [workflow.md](workflow.md),
[ship-it.md](ship-it.md).

### Stage 5 — The analysis command — implemented

The command that inspects an existing project (read-only) and returns a report. It runs exactly six
deterministic checks — exposed secrets, `.gitignore` completeness, presence of tests, presence of a
README, basic database-convention text checks, and oversized files — and never changes the project.
The deeper judgement (the full upgrade plan, the cost/risk narrative) is left to the assistant the
developer already uses. See [analyze.md](analyze.md).

### Stage 6 — The project home — planned

The honest presentation, the contribution rules (the review gate for community input), and the
license, all in the repository. The review gate is a design target, not yet built. See
[../README.md](../README.md), [../LICENSE](../LICENSE).

### Stage 7 — The final proof — planned

Scaffold real projects to validate end to end, plus the deliberately-vulnerable target (a test
dummy full of holes on purpose) that proves the security checks actually catch the failures. Not yet
built.

## Rule for each stage

Built locally, **tested**, and only then the next one. The check suite grows with each stage. The
public release happens only after Stage 7 passes in full.
