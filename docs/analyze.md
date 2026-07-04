# The analyze-an-existing-project command

> **What it is:** `analyze` — the read-only sibling of the `new` command. It points at a project that
> **already exists**, measures it against the 8 pillars, and returns a report with the
> gap, the plan, and the cost/risk. See [pillars.md](pillars.md).
>
> **Status — what is built today:** only three commands exist: `new` (scaffolds a project), `check`
> (three text guards over files — exposed secrets, oversized files, dangerous patterns — plus the
> project's own gates: format, lint, types, tests, and a dependency audit), and `analyze` (this
> command). `analyze` today runs **exactly six presence/convention checks** — exposed
> secrets, a `.gitignore` rule for `.env`, presence of tests, presence of a README, a plain-text
> database-convention check over `.sql` files, and oversized files — and produces a report. It only
> reads and reports — it changes nothing. Acting on anything it recommends is a separate decision you
> make later, by hand. Everything beyond those three commands (dependency-vulnerability scanning,
> tenant-isolation query checks, dangerous-pattern scanning, accessibility, and the
> before-going-live workflow) is the **target**, not built yet.

---

## Principle

Any good standard needs two things: to **start right** (the `new` command) and to **measure what
already exists** (this command). `analyze` **only observes and reports** — it touches nothing.
Actually applying the changes is a separate decision you make later.

## What it does and does not do

| Does                                            | Does not                                  |
| ----------------------------------------------- | ----------------------------------------- |
| Observes the project (reads only, no execution) | Does not run the project or its tests     |
| Runs the six deterministic checks over it       | Does not modify any file                  |
| Compares against the 8 pillars                  | Does not create an account in any service |
| Delivers a report                               | Does not decide anything for you          |

## How it works

1. You **point `analyze` at an existing project**.
2. It **observes** (reads only) and runs the **six deterministic checks** — the mechanical part, at zero cost.
3. It **compares against the 8 pillars**: what is in place, what is missing.
4. It delivers the **three-part report** (below).
5. It stops there. Nothing is changed — acting on the report is your call.

## The six checks that run today

These are the only checks `analyze` performs right now — all plain, deterministic, no AI:

1. **Exposed secrets** — scans text files for likely secrets.
2. **`.env` kept out of the code** — checks for a `.gitignore` rule covering `.env`.
3. **Has tests** — looks for test files or a `tests/` folder.
4. **Has a README** — looks for a `README.md` at the root.
5. **Database conventions** — a plain-text match over `.sql` files (with SQL comments stripped
   first, so a term mentioned only in prose never counts) for three core terms (`uuid`,
   `created_at`, `deleted_at`). Tenant isolation (`tenant_id`) is reported separately, never as a
   pass/fail: a single-owner schema is a legitimate choice, so the check passes with an explicit
   "single-owner schema — no tenant isolation" note instead of claiming isolation that does not
   exist. It is a text check, not a real SQL analysis.
6. **No oversized files** — flags files past the size threshold.

## The report (three parts)

### 1. Where it stands today vs. the standard

Pillar by pillar (all 8), what already passes and what is missing. The **gap to the standard**, made clear.

### 2. Upgrade plan — **prioritized**

What to do to get there, **in the right order**: the most critical and highest-return items first
(security and tenant isolation up front; visual polish later).

### 3. Cost and risk per item

- **Effort** on a simple scale: **small / medium / large** (no faking hour-level precision).
- **Risk** of touching it: **low / medium / high** (a change that could break surrounding code weighs more).
- **Honesty note:** these ratings are **fixed per check** — each deterministic check carries a
  pre-assigned effort/risk class, chosen when the check was written. They are indicative ordering
  hints, not a computed estimate of your codebase. The deeper, project-specific cost/risk judgement
  belongs to the assistant the developer already uses (see below), and is planned, not built.

## The intelligence — who does what

- **The six deterministic checks** surface the mechanical gap they cover today (an exposed secret, a
  missing `.env` rule, no tests, no README, a database file missing an expected convention term, an
  oversized file) — **free, no AI**. Deeper mechanical checks such as dependency-vulnerability scanning
  and tenant-filter query analysis are **planned**, not part of this command yet.
- **Your own AI** makes the judgment calls that need a head: severity, the upgrade plan,
  the risk estimate. It runs on your own AI — never a metered platform layer.

## Connections

- Measures against the same [8 pillars](pillars.md) the `new` command applies.
- Tenant isolation and exposed secrets (the most serious findings) come from
  [Security](security.md) — today `analyze` checks exposed secrets; the tenant-isolation
  (tenant-filter) check is planned there, not yet built.
- If you decide to act on the report, the upgrade is meant to follow the [Workflow](workflow.md)
  (review gate, tests at every step) — that workflow is the planned standard, not something this
  read-only command carries out for you.
