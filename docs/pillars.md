# Keystone — Three Layers, Eight Pillars

> **What this document is:** the blueprint that defines what every project scaffolded by Keystone is
> meant to ship with. An open, unbranded standard any team can adopt as a common foundation.
>
> **Status — what is actually built today:** three commands exist. `new` scaffolds a new project
> (asks setup questions, then copies a template). `check` runs **three** deterministic file
> guards: an exposed-secret scan, an oversized-file check, and a dangerous-pattern scan
> (injection/XSS vectors: dynamic code execution, raw HTML injection, shell commands built with
> interpolation) — plus the **project's own gates** (formatter, linter, type-checker, tests, and a
> dependency-vulnerability audit), blocking when any fails. `analyze` is read-only
> (reports only) and runs exactly **six** checks: exposed secrets, `.gitignore` completeness,
> presence of tests, presence of a README, basic database-convention text checks (plain string
> matching over `.sql` files), and oversized files. **Layer B — the agent harness — is built and ships
> in every scaffolded project (see below).** The **two-environment deploy pipeline** (staging from
> `develop`, production from `main`) also ships in both templates today — see the Ship it pillar
> below and [ship-it.md](ship-it.md) for the exact status. **Layer C — experience quality — ships in
> the web template** (structural-accessibility and colour-contrast gates, a usability checklist, and
> UI reviewers; see the DNA section below). Everything else in this document — every
> other pillar behavior, the automatic before-going-live gate, and the edge protection — is the
> target, not yet delivered. Where a capability is planned, this document says so; it is never
> described as running today.

---

## The DNA — three complementary layers

Keystone is **three complementary layers** — one for _what_ gets built, one for _who_ builds it, and
one for _how good it is to use_.

**Layer A — Product Foundation (deterministic, zero-cost).** The design goal is that none of the
quality pillars depend on AI inference: the deterministic parts should work for free — checks,
written rules, configuration. The aim is a project that is secure, tested, and well-built even
without using any AI at all. Today only a small slice of Layer A exists (see the status line above);
the rest is the target.

**Layer B — Agent Harness (built).** The project is built by an AI coding agent — the assistant the
developer already uses — and Layer B is that agent's harness: what shapes its context, the spec it
follows, the specialists it consults, and the guardrails that stop it from going wrong. It runs
entirely on the developer's own AI, with no external paid service required. **Layer B ships today:
every scaffolded project ships with it** (see the seven parts below), distilled from real, production
working practice rather than invented on a whiteboard.

**Layer C — Experience Quality (built).** A usable, accessible, consistent interface is part of a
finished project — enforced **neutrally**, never a specific look. Layer C ships today in the web
template: hard gates where a machine can decide (structural accessibility in the linter, colour
contrast measured in a real browser, an explicit mobile viewport), a mandatory checklist that makes
the project answer the usability questions, and isolated-context reviewers that recommend where the
call is judgment (hierarchy, the four states, keyboard access, visual consistency). The visual system
stays bring-your-own: Keystone guards the quality, a design skill creates the look.

The three layers keep AI in its place: Layer A's quality guarantees are deterministic and run at zero
AI cost, so AI is never the basis of the quality guarantee; Layer B gives the coding agent a
first-class harness that runs on the developer's own AI; and Layer C holds experience quality to the
same standard without imposing a house taste. In short, the AI harness applies to _building_ the
code, not to _guaranteeing_ its quality.

---

## Layer A — the 8 pillars

Each pillar has its rule in full. Except for the specific checks named in the status line above
(secret scan + size in `check`; the six presence checks in `analyze`), the behaviors below describe
the **target** a scaffolded project aims for — they are not running today.

1. [Foundation](foundation.md)
2. [Code quality](code-quality.md)
3. [Database](database.md)
4. [Tests](tests.md)
5. [Workflow](workflow.md)
6. [Ship it](ship-it.md)
7. [Security](security.md)
8. [Documentation](documentation.md)

### 1. Foundation

_Target — not yet enforced by any command._

- The same internal organization in every project (a fixed place for each thing).
- Accessible by default (usable by people with disabilities — sight, hearing, keyboard-only).
- Dates, money, and numbers in the user's country format, automatically.
- Starting language and screen priority (mobile / desktop / both) are **always asked** at setup —
  never assumed. (The `new` command already asks setup questions; the full foundation this implies
  is the target.)
- Responsiveness is foundation, always. Visual identity (color, font, accent) belongs to the
  project, not to the template.

### 2. Code quality

_Partially built. `check` runs the oversized-file guard plus the project's own gates (formatter,
linter, type-checker, tests, dependency audit), blocking on failure — see the status line at the
top of this document. Auto-format-on-save and a template-embedded "zero errors, zero warnings"
publish gate remain the target._

- A single format that fixes itself on save (no manual style decisions) — **planned**.
- Any error or warning should **block shipping** — a "zero errors, zero warnings" rule. 🔧 `check`
  already blocks on a formatter, linter, or type-checker failure today; wiring that same rule into
  an automatic before-going-live/CI gate is still the target.
- An automatic warning when a file/section grew too large. The oversized-file check exists today in
  both `check` 🔧 and `analyze` 🔧; wiring it into a shipping gate is the target.
- Comment only where it isn't obvious: explain the _why_ (a decision, a business rule), never the
  trivial.

### 3. Database

_Target — not yet enforced. `analyze` today does only basic text checks over `.sql` files (plain
string matching) 🔧; none of the guarantees below are implemented._

- Automatic created/updated timestamps on every record.
- Delete = hide and stay recoverable (nothing truly disappears) — soft delete.
- Every structural change through recorded, repeatable steps; nobody edits directly.
- Non-sequential identifiers (UUIDs) (never 1, 2, 3).
- Internal names always in English. Every record carries the tenant id (tenant isolation) — see
  Pillar 7. (No tenant-isolation query check is built; this is the target.)

### 4. Tests

_Partially built. `analyze` only checks that tests are **present** 🔧 (read-only, no run). `check`
goes further: it runs the project's own test command as one of its gates and blocks when a test
fails 🔧. Wiring that block into a before-going-live/CI gate remains the target._

- A test ships with the feature, from day one (the suite grows with the project).
- Covers the happy path **and** the unhappy paths (invalid input, abuse, no permission).
- A failing test should **block shipping** — 🔧 `check` already blocks locally on a failing test;
  wiring the same block into an automatic before-going-live/CI gate is still **planned**.
- Measured by focus on the critical (money, login, customer data), not by a coverage percentage.

### 5. Workflow

_Partially built. The three branch levels and the session hand-off ship today (see below); the
review gate and the task-board automation remain the target._

- 🔧 Three levels: trunk (`main`) → staging (`develop`) → daily work, with the main branch
  protected by the project's git hooks and a bundled protection-setup script. Shipped.
- Every change passes a review gate before entering the protected branch — **planned**.
- A task board (to do / doing / done) — an opt-in, documented manual setup, not a shipped wired
  board (see [workflow.md](workflow.md)).
- 🔧 Session hand-off: close a work session and resume it later without re-explaining context, so
  context survives from one session to the next — shipped as a Layer B rule (B5).
- Every change records its author (person or AI agent) — carried by the work-tracking rule (B7).

### 6. Ship it

> Full rule in [ship-it.md](ship-it.md).

_What ships today:_ both templates carry a **two-environment deploy pipeline** — staging deploys
from `develop`, production deploys from `main`. Each run goes gates -> migrate-before-code ->
deploy -> smoke check, in that order, failing loudly at any step. Per-environment secrets are held
by the hosting service's environment feature, including a separate database connection string per
environment. The pipeline leaves exactly **one line** for the owner to fill with their host's
deploy command (hosting is the developer's choice, never assumed); until filled, that step fails
with instructions rather than a fake green. Still the **target**: the automatic before-going-live
gate that wires this pipeline to the review gate, and one-step rollback.

- Ships itself once it passes the gates (tests + checks) — built up to the host line.
- A staging environment (an identical copy) before production — the pipeline and per-environment
  secrets ship; standing up the actual staging host/database is the owner's one-time setup.
- Fast rollback if something breaks in production — **planned**, not yet built.
- Each environment's secrets and keys always kept out of the code — built, via the hosting
  service's environment feature.

### 7. Security

> Full rule in [security.md](security.md).

_What runs today:_ the exposed-secret scan in `check` 🔧 and in `analyze` 🔧, plus a
dangerous-pattern scan in `check` 🔧 (injection/XSS vectors). Everything else in this pillar is the
**target**.

- **Security in code, not in a paid agent** — the intent is that deterministic checks run on their
  own at zero cost, and that the developer's own AI (Layer B) can hunt deeper via a metered hook that
  stays off by default. Today only the secret scan is deterministic and running; the deeper hunting
  is planned.
- **Two fronts, different weights:**
  - _Application-layer security_ (the core) — each customer sees only their own, firm login, correct permissions,
    never trust incoming input, secrets kept. This is where mistakes most often occur, and it is
    squarely the application's own responsibility to get right. (Design goal; not yet checked
    automatically beyond the secret scan.)
  - _Edge protection_ (the smaller front) — block abuse / excess access at the edge. **Planned**; no
    edge/abuse/rate-limit protection is wired up today.
- **Closed decisions (design intent):**
  - Essential from day one; reinforced as the project grows.
  - The aim is that automatic checks block on the dev machine **and** again before going live (a
    double net) — the automatic before-going-live/CI gate is **planned**; today the local `check`
    runs the text guards and the project's own gates, on demand.
  - Abuse protection (edge) on by default — **planned**, not built.
  - AI-driven vulnerability hunting — a **planned** integration point, off by default, zero cost
    until someone turns it on. Not built.

### 8. Documentation

_Target — not enforced by any command. `analyze` today only checks that a README is **present** 🔧._

- Every important architectural decision becomes a short permanent record (the _why_).
- Documentation of how the system works is generated from the code itself whenever possible.
- Created alongside the project, in the moment — not at the end.
- Any interface exposed to other systems (an API) comes with a clear usage guide.
- Technical documentation in English; the front-end in the product's language.

---

## Layer B — the agent harness (built)

The project is built by an AI coding agent, with Layer B as the scaffolding around that agent — six
parts. Like Layer A, it runs on the developer's own AI, with no external paid service required. **All
seven parts ship today**, copied into every scaffolded project (`templates/agent-harness/`, laid on
top of the template by `new`), and each is distilled from real working practice, not invented.

> How it lands: `new` copies the shared harness on top of the chosen template, so a fresh project
> ships with `.claude/` (agents, hooks, settings, rules), `specs/` (the spec workflow), `memory/`
> (the long-term memory index), `knowledge/project-journal/` (briefings and the per-coder daily
> log), and `docs/agent-harness.md` (the map). The guardrail hooks are proven to block by an automated test.

### B1. Context engineering — _built_

The agent works with the right context and its working memory stays focused.

- The agent loads a lean set of always-on instructions (`CLAUDE.md`) and pulls deeper knowledge only
  when a task needs it, so its context stays focused.
- Rules activate only where they apply — a scoped rule under matching files (`.claude/rules/`), not
  everywhere.
- Docs (`docs/`, `.claude/`) are consulted on demand, never auto-loaded.
- _Still the target:_ an automatic check that flags an always-on instruction set that has grown too
  large. (Cross-session persistence is delivered by B5 and B6 below.)

### B2. Spec-driven development — _built_

The spec is the source of truth and code derives from it.

- Every feature opens with a **spec** (`specs/<slug>/spec.md`): the request restated + a **verifiable
  "done" target**, approved before any code is written.
- On completion, the delivered work is checked against the "done" target point by point, and any gap
  is reported explicitly rather than glossed over.
- When code and spec diverge, the spec wins.

### B3. Subagents — _built_

Isolated-context specialists, in `.claude/agents/`.

- Reviewers and auditors that work in their own context window and return a focused verdict, keeping
  the main thread clean.
- Shipped: a **spec reviewer**, a **code reviewer** (a rigorous review rubric), and a **security
  auditor** (the security pillars).
- Division of labor with B2: spec-driven development defines _what_ to check (the "done" target); the
  subagents are _who_ checks it in isolation — the spec reviewer validates the target, the code
  reviewer validates the diff.
- A failed verdict is meant to be **enforced by a guardrail** (B4), not left to the main agent's
  discretion.

### B4. Guardrails — _built_

Hooks that block, not ones that merely warn. Deterministic hooks in `.claude/hooks/`, registered in
`.claude/settings.json`.

- **Lifecycle hooks** that deterministically block off-standard behavior before a tool runs.
- They are the harness's hard guarantees: enforced by the system, not a promise by the agent.
- Shipped and proven by test: `block-secret` (blocks staging/reading a `.env` secret) and
  `block-protected-branch` (blocks a commit/push straight onto a protected branch).
- Deliberately **not** a hard hook: "block declaring work done that isn't". Whether a "done" claim is
  honest is a judgment, not a regex — so it lives in the B2 workflow (the point-by-point check against
  the done-target), not in a hook that would give false confidence. Being honest about which
  guarantees are hard and which are judgment is itself part of the standard.

### B5. Session continuity — _built_

Work survives the end of a session. Rule: `.claude/rules/session-lifecycle.md`.

- Explicit commands the user gives: **"resume session"** to start, **"close session"** to end.
- On resume: identify the coder (from the version-control user name), read the newest briefing,
  survey the codebase **beyond** the briefing before acting, open the daily-log entry (session
  number, date, start time), then delete the briefing — briefings are disposable by design.
- On close: write the next briefing from the embedded template, close the daily log (end time,
  total duration, summary), and move durable decisions into long-term memory (B6).
- **Context budget:** at roughly 60% of the context window, the agent winds down and hands off —
  a clean hand-off beats a degraded long session.
- Enforcement tier: a rule the agent follows (strong guidance), not a hook — a script cannot judge
  whether a summary is truthful, and a fake guarantee would be worse than an honest rule.

### B6. Long-term memory — _built_

Permanent facts outlive sessions. Rule: `.claude/rules/long-term-memory.md`.

- `memory/` at the project root: one fact per file, indexed by `MEMORY.md` (the index is what gets
  loaded, never full contents).
- Durable decisions are saved **proactively**, the moment they happen; existing memories are
  updated instead of duplicated; memories proven wrong are deleted.
- The boundary with B5: briefings carry **in-flight state** (disposable), memory carries
  **permanent facts** (rules, decisions, invariants).
- Same enforcement tier as B5: a followed rule, honestly declared as such.

### B7. Work tracking — _built_

Every unit of work is traceable. Rule: `.claude/rules/work-tracking.md`.

- One branch = one issue = one pull request: the agent opens an issue before starting a unit of
  work, so nothing lands untracked.
- Distilled from the multi-contributor discipline (each unit of work has a home and an author),
  stated generically — no dependency on any one tracker.
- Enforcement tier: a followed rule, with an honest degraded-mode note when no tracker is reachable.

---

## How the layers and pillars are meant to interlock (not loose boxes)

_This section describes the intended design; most of the mechanisms it references are still the
target._

- _Tenant isolation_ (Security) is meant to live in the _Database_ pillar (tenant id + non-sequential
  identifiers (UUIDs)).
- The _"always blocks"_ of _Code quality_ is meant to be enforceable because of _Tests_.
- The _"ships itself"_ of _Ship it_ is meant to be safe only because of the _Code quality_ and
  _Tests_ gates.
- The **same automatic-check mechanism is meant to recur across three pillars** — Code quality,
  Tests, and Security — as the deterministic enforcement of Layer A. Today that mechanism runs as the text
  guards (secret, size, dangerous) plus the project's own gates (format, lint, types, tests, audit).
- **Layer A's deterministic checks and Layer B's guardrails are the same idea at two levels:** A
  guards the code, B guards the agent that writes it. Both ship today — A's secret/size/dangerous
  scans, B's block-secret and block-protected-branch hooks.
- The spec-driven **"done" target** (B2) is meant to feed the _Tests_ (A4) and the completion check.
- **Session hand-off** (A5) is meant to be where the agent's cross-session memory (B1) persists.

---

## Build phases — start with Security

_Roadmap. Phase 1 is only partially delivered (the local secret scan and size check exist; the
publish-time gate and template-embedded rules do not). Phases 2–4 are not started._

| Phase                      | Delivery                                                                                                                                       | AI cost           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **1 — Rules + checks**     | Written pillar rules + automatic checks embedded in the project template, blocking flawed code on the machine (a publish-time gate is planned) | Zero              |
| **2 — Edge protection**    | Edge abuse-blocking pre-tuned and on by default                                                                                                | Zero              |
| **3 — Test dummy**         | A target deliberately full of holes, to prove the pillar catches the failures                                                                  | Zero              |
| **4 — (optional, future)** | AI-driven vulnerability-hunting integration point, off by default                                                                              | Only if turned on |

---

## References behind the Security pillar (chosen for relevance to typical web-app projects)

_These are reference standards and tools the Security pillar is designed around. Except for the
exposed-secret scan, none is integrated into Keystone's commands today — they mark the direction, not
the current implementation._

Application-layer security front — guides for what must exist:

- OWASP ASVS — application security verification standard (base #1)
- OWASP Cheat Sheet Series — how to do each thing the secure way
- OWASP Web Security Testing Guide — how to test security

Application-layer security front — find the flaw automatically (no AI) — **planned integrations, not built:**

- Semgrep — automatically flags dangerous patterns in your code
- OWASP Dependency-Check — warns when a third-party piece has a known flaw

Edge protection front — **planned, not built:**

- express-rate-limit — a mature reference for blocking excess access

Validation (future):

- OWASP Juice Shop — a site deliberately full of holes, to prove the pillar works

Conceptual reference: Anthropic's public guidance on AI-assisted code defense.
