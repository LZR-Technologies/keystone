# Documentation index

> **What this folder is:** the design documents for Keystone — an open, unbranded standard for
> scaffolding a new software project on professional foundations, and for keeping that project close
> to the standard through its life. Any team can adopt it as a common foundation.
>
> **Status:** three commands are implemented today — create a new project, run the automatic checks,
> and analyze an existing project (read-only). Everything else described across these documents is
> planned design, not shipped software; each document carries its own status line. This index only
> maps the folder — read the linked documents for the detail.

---

## The three layers

Keystone is built as **three complementary layers**:

- **Layer A — Product Foundation.** Deterministic, zero AI cost: the eight quality pillars a
  scaffolded project ships with, plus the checks that hold them. This is where the three
  implemented commands live.
- **Layer B — Agent Harness.** Built: `new` lays it into every project (reviewers, guardrail hooks,
  the spec workflow, layered context — distilled from real working practice). It runs on the
  developer's own AI assistant — never a separate paid service.
- **Layer C — Experience Quality.** Built: the web template ships accessibility and colour-contrast
  gates, a usability checklist, and UI reviewers — enforced neutrally, never a house look.

See [pillars.md](pillars.md) for the blueprint that ties the layers together.

## Start here

- **[overview.md](overview.md)** — the core rationale: who it serves, what it promises, how far it
  reaches, and why the AI is always the developer's own.
- **[pillars.md](pillars.md)** — the blueprint: the three layers and the eight quality pillars, end
  to end.

## The commands

- **[commands.md](commands.md)** — the full project-creation flow, from the initial command to a
  scaffolded, working project. _(Implemented.)_
- **[setup-wizard.md](setup-wizard.md)** — the setup flow in detail: what the wizard asks, what it
  infers, and what it never asks. _(Implemented.)_
- **[analyze.md](analyze.md)** — the read-only command that measures an existing project against the
  pillars: distance from the standard, an upgrade plan, and an estimate of cost and risk.
  _(Implemented.)_

The automatic checks — the deterministic pillar checks run over a project at zero AI cost — are the
third implemented command; their behavior is defined pillar by pillar in the documents below.

## The eight pillars

Each document is the full rule for one pillar. The rules are the standard the scaffold aims for;
where a rule describes something not yet wired in, the document says so inline.

- **[foundation.md](foundation.md)** — Foundation: one consistent structure, accessible by default,
  locale-aware, starting language and screen priority asked up front.
- **[code-quality.md](code-quality.md)** — Code quality: auto-formatting, blocking on any error or
  warning, oversized-file flags, comments that explain the _why_.
- **[database.md](database.md)** — Database: timestamps on everything, soft delete, versioned and
  repeatable migrations, non-sequential identifiers (UUIDs).
- **[tests.md](tests.md)** — Tests: ships with each feature, covering the happy path and the failures,
  a failing test blocking a ship.
- **[workflow.md](workflow.md)** — Workflow: three branch levels, a review gate, a task board, and
  session hand-off. _(Parts are planned — see the document.)_
- **[ship-it.md](ship-it.md)** — Ship it: the delivery pipeline, a staging copy before production,
  rollback, secrets kept out of the code. _(Parts are planned — see the document.)_
- **[security.md](security.md)** — Security: essential from day one, reinforced when needed, checks on
  the machine and before shipping, abuse protection on by default.
- **[documentation.md](documentation.md)** — Documentation: decisions become short records, docs
  generated from code where possible, ready from the start of the project.

## Planning

- **[build-plan.md](build-plan.md)** — the roadmap from these design documents to working code:
  what is built, what is planned, and the order of the stages.

---

_Keystone — the stone that holds the whole arch together: a project's foundation, in place from day
one._
