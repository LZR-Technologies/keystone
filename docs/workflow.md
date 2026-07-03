# Workflow Pillar — full rule

> The full rule behind the Workflow pillar. Skeleton in [pillars.md](pillars.md).
> Open collaboration in [the open-project guide](README.md). 🔧 = automatic check.
>
> **Status:** this pillar is the **standard the scaffold aims for** — mostly **planned, not yet
> built**. What runs today are three commands: creating a new project, running the automatic checks,
> and analyzing an existing project read-only. Everything below about branch levels, review gate,
> task board, worktrees, authorship recording, session hand-off, and community-contribution intake
> describes the target design — none of it ships as a working gesture yet.

## Principle

The "how work happens" is meant to come pre-assembled, so a project would start organized and never
lose the thread between sessions. The same structure is what would let a project open up to a
community without turning into chaos.

## 1. Three levels — _built (the isolated-workspace refinement remains planned)_

- Three lines: **trunk** (`main` — what is live / done), **staging** (`develop` — what is being
  integrated), and **daily work** (each person's active branch). The main line is never edited
  directly.
- 🔧 What ships today: `new` pins the protected branch (`git init -b main`), records the baseline
  commit there, and leaves the developer on `develop`; the template's git hooks refuse a direct
  commit or push to a protected branch (for humans, not only for the agent); and a bundled script
  configures the protected branch's protection on the hosting service (required review + required
  checks).
- _Planned:_ each independent line of work getting its own isolated workspace.

## 2. Review gate before the protected branch (planned)

- The standard is that every change would pass a **review** before entering the main line — the
  gate existing even for a solo developer, with the automatic checks reviewing alongside it.
- This gate is not yet built. When it exists, the aim is that only what passes the checks and the
  review reaches the main line. Community pull requests are meant to run through the same kind of
  filter — see the contribution flow in [README.md](README.md) — but that intake is likewise part of
  the planned design, not something that receives contributions today.

## 3. Task board (planned, opt-in)

- The design is for a project to come with a **board** (to do / doing / done) already set up, so
  progress is visible from day one. A zero-setup, wired-by-default board is not built: creating and
  wiring a real GitHub Project board is host-specific and easy to break for everyone the moment an
  issue or PR opens, so it is deliberately left as a manual step instead of a bundled workflow. Both
  templates document that setup end to end (`docs/project-board.md` in the generated project),
  including the built-in, no-code project automations GitHub itself offers and where to add a
  repository-specific workflow if those are not enough.

## 4. Session hand-off — _built (as a Layer B rule)_

- 🔧 Two paired actions, shipped in the agent harness (`.claude/rules/session-lifecycle.md`):
  **"close session"** writes a hand-off briefing and closes the per-coder daily log (session number,
  date, start/end time, total duration, summary); **"resume session"** reads the newest briefing,
  surveys the codebase beyond it, opens the next daily-log entry, and deletes the absorbed briefing.
- Includes a context budget: at roughly 60% of the context window the agent winds down and hands
  off, because a clean hand-off beats a degraded long session.
- Enforcement tier is declared honestly: a rule the agent follows, not a hard hook — see
  [pillars.md](pillars.md), B5.

## 5. Author on every change (planned)

- The standard is for every change to record **who did it** (a person or an AI agent), since several
  contributors may work on the same project. It is meant to tie into the database audit trail. This
  authorship recording is part of the planned design, not a built behavior.

## 6. Tests on every change (planned)

- The design is for the check suite to run on every change, with the suite growing over time. See
  [tests.md](tests.md).
- 🔧 The automatic checks (code quality + tests) exist and can run today; wiring them into a review
  gate on every change is the planned part.
