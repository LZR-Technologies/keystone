# The agent harness (Layer B)

> This project is meant to be built by an AI coding agent -- the assistant you already use.
> The harness is the scaffolding around that agent: what shapes its context, the spec it
> follows, the specialists that review it, and the guardrails that stop it going wrong. It runs
> entirely on your own AI, with no external paid service. Everything here is deterministic
> configuration and written rules -- it costs nothing until you invoke the agent.

The harness has seven parts. Each is distilled from a working practice, not invented.

Two enforcement levels run through everything below, and knowing which is which matters.
**Hooks** are hard guarantees: scripts the harness executes on the agent's tool
lifecycle, which the agent cannot skip or talk its way past. **Rules** are strong
guidance: written instructions loaded into the agent's context and followed with high
reliability -- but ultimately by the agent's own discipline. Each part below says which
it is; claiming hook-grade certainty for rule-grade practice is exactly the false
confidence this harness refuses.

## B1 -- Context in layers

What loads always must be small; what is detailed loads on demand.

- **`CLAUDE.md`** (root) -- loaded every session. Kept lean: stack, commands, where-to-look.
- **Nested `CLAUDE.md`** -- a folder's own conventions, loaded only when the agent works there.
- **`.claude/rules/`** -- conventions scoped by path (a database rule under database
  files), or unscoped for rules that govern the session itself rather than a file type
  (session lifecycle, memory discipline, work tracking -- B5, B6, and B7).
- **`docs/`** and **`.claude/`** -- consulted on demand, never auto-loaded.

The point: the agent works with the right context and its working memory stays focused.

Enforcement: a **rule-level** practice by nature -- what loads where is configuration,
and keeping the always-on layer lean is discipline.

## B2 -- Spec-driven, with a verifiable done-target

The spec is the source of truth; code derives from it.

- Every feature opens with `specs/<slug>/spec.md`: the request restated **plus a verifiable
  "done" target**, approved before any code is written.
- Before that approval, the spec goes through a **clarification pass** (rule:
  `.claude/rules/clarify-before-building.md`): ambiguities, conflicts with the constitution,
  undefined rules, edge cases, and untestable requirements are surfaced and asked -- not guessed.
- Once approved, the spec becomes a **plan and small tasks** (rule:
  `.claude/rules/plan-and-tasks.md`): each task traceable to a line of the done-target, so the
  work stays reviewable and nothing lands untracked.
- On completion, the delivered work is checked against that target point by point (rule:
  `.claude/rules/verify-against-done-target.md`), and any gap is reported explicitly rather than
  glossed over -- a thing that exists but does not meet the target is not done.
- When code and spec diverge, the spec wins.
- Above every individual spec sits the **constitution** (`specs/constitution.md`): the project's
  non-negotiables. When a spec and the constitution disagree, the constitution wins and the spec
  changes -- a feature spec cannot quietly override a project-wide rule.

The feature-spec template lives in `specs/000-example-feature/spec.md`; the constitution ships
beside it as `specs/constitution.md`, adapted per project.

Enforcement: a **rule** -- whether the delivered work truly meets the done-target is a
judgment, made in the open against the spec, not something a script can certify.

## B3 -- Reviewers in isolated context

Specialists that work in their own context window and return a focused verdict, keeping the
main thread clean. Under `.claude/agents/`:

- **`spec-reviewer`** -- validates the done-target before any code (division of labor with B2).
- **`code-reviewer`** -- checks the diff against the rubric (design, edge cases, tests,
  security, performance, reviewability, restraint).
- **`security-auditor`** -- audits tenant isolation, auth, secrets, and input validation.

A failed verdict is meant to be enforced by a guardrail (B4), not left to goodwill.

Enforcement: the reviewers themselves are **rule-level** (the agent invokes them as the
workflow says); the consequence of a failed verdict is where **hooks** add enforcement.

## B4 -- Guardrails that block, not warn

Deterministic hooks on the agent's tool lifecycle, registered in `.claude/settings.json`.
They are the harness's hard guarantees: enforced by the system, not a promise by the
agent. Shipped in `.claude/hooks/`:

- **`block-secret`** -- blocks staging/committing or reading a `.env` secret file.
- **`block-protected-branch`** -- blocks a commit or push straight onto a protected branch;
  work goes through a feature branch and a reviewed pull request.

One rail this harness deliberately does **not** fake as a hard hook: "block declaring work
done that isn't". Whether a claim of "done" is honest is a judgment, not a regex -- so it
lives in the B2 workflow (the point-by-point check against the done-target), not in a hook
that would give false confidence. Being honest about which guarantees are hard and which
are judgment is itself part of the standard.

**Which tools the hooks watch.** The hooks fire on a `PreToolUse` matcher of
`Bash|PowerShell`, so they cover both shells the agent can run commands through: the Bash
tool and -- on Windows, where it is the default -- the PowerShell tool. Both deliver the
command string at `tool_input.command`, which is what the hooks read. Covering PowerShell
matters concretely: its default reader is `Get-Content` (not `cat`), and a push refspec
like `git push origin HEAD:main` is just as reachable from PowerShell as from Bash --
without the PowerShell arm of the matcher, those would bypass the rails entirely on a
Windows machine. One honest caveat on the tool name: the matcher's alternation syntax is
documented, but the exact string `PowerShell` for the tool name is confirmed empirically
(it is the tool-name key Claude Code uses in its own permission entries), not from a
published list of tool names -- if a future version renames that tool, this arm would
need updating.

**Honest limits of these two hooks specifically.** Both are pattern matches against the
literal shell command the agent is about to run, so both have known holes. `block-secret`
matches a command that names `.env` explicitly, so a broad `git add -A` or `git add .`
that happens to sweep up an untracked `.env` file is not caught by name -- nothing in the
command text says `.env`; it also matches the known readers by name (`cat`, `less`,
`more`, `head`, `tail`, `type`, and the PowerShell `Get-Content`/`gc`), so a reader
outside that list slips through. `block-protected-branch` matches `git commit` and
`git push` -- including a push whose refspec targets a protected branch from another
branch (`git push origin HEAD:main`) -- but a `git merge <branch> && git push` sequence
lands the merge before the push is even inspected, and a merge performed through a
different tool than the shell is invisible to it entirely. These are **conveniences that
catch the common, careless case** -- typing `cat .env` or `Get-Content .env`, committing
straight onto `main`, pushing onto `main` from a side branch -- not an exhaustive
guarantee against a determined or unusual command shape. Treat them as a second net, not
the primary one.

The primary net for protecting humans is unchanged by anything an agent's hooks can do:
the project's own pre-commit hooks (running on every contributor's machine, agent or
not) and server-side branch protection on the hosting platform (rejecting a direct push
to a protected branch regardless of what produced it). Those layers do not trust the
command text; they inspect the actual result. An agent's `PreToolUse` hook is a fast,
local, best-effort check that reduces how often the slower, authoritative layers have
to say no -- it is not a substitute for having those layers.

Enforcement: **hooks** -- the hard tier for the commands they do match. Everything here
is executed by the harness, not promised by the agent; the honest caveat above is about
coverage (which commands get inspected), not about whether a match is enforced.

## B5 -- Session continuity

An agent session forgets everything when it ends. B5 makes the hand-off a routine instead
of a loss. The user drives it with two explicit commands -- **"resume session"** (or
"continue") to start, **"close session"** (or "wrap up") to end -- and the agent runs a
fixed sequence around each (rule: `.claude/rules/session-lifecycle.md`).

- **On resume:** identify the coder from the version-control user name; read
  `memory/MEMORY.md` (B6's index) and open whichever memories look relevant to today's
  work -- this is what makes B6 a round trip instead of a write-only log; read the
  newest briefing under `knowledge/project-journal/briefings/<coder>/`; survey the
  actual codebase beyond the briefing (version-control state, README, structure, every
  file the briefing mentions) before acting; open a timed, numbered entry in the
  coder's daily log, getting the real wall-clock time from a date/time command rather
  than leaving it blank; present the resume summary, and only then delete the absorbed
  briefing -- summarize from it before discarding it, never the reverse. A briefing more
  than 7 days old is flagged as possibly stale and confirmed against the survey rather
  than trusted outright. A session found still open from earlier the same day (the common
  crash-or-restart case) is closed first, marked as recovered, before a new one opens.
- **On close:** write the next briefing from the embedded template; stamp end time and
  total duration in the daily log with a summary of what was done and what is open;
  move durable decisions into long-term memory (B6); and commit **and push** the daily
  log, the briefing, and any memory changes on the working branch (a conventional commit
  such as `chore(journal): close session N`) so they travel with the repository to the
  next machine or coder -- a local-only commit never leaves the machine and so hands off
  nothing.
- **Context budget:** at roughly 60% of the context window, wind down -- finish the
  current step, close, and hand off. Reasoning degrades as the window fills; a clean
  hand-off beats a degraded marathon. No tool here reports an exact percentage, so this
  is an approximate self-check: use the coding environment's own context indicator when
  it exposes one, and otherwise a cluster of proxies (a long tool-call stretch, a
  transcript that has grown hard to hold in mind) rather than any single weak signal.

The supporting structure ships with the project so the rule has real ground to act on:
`knowledge/project-journal/briefings/` (disposable per-coder hand-offs) and
`knowledge/project-journal/daily-log/` (the permanent per-coder record).

Enforcement: a **rule** -- strong guidance the agent follows every session, not a hook.
A script cannot judge whether a summary is truthful or a codebase survey was real;
pretending it could would be the theater B4 refuses.

## B6 -- Long-term memory

Briefings carry in-flight state for exactly one hand-off; permanent facts need a home
that outlives both sessions and briefings. That home is `memory/` at the project root:
one fact per file, typed (`decision`, `preference`, `project-state`, `reference`), with
`memory/MEMORY.md` as the index -- one line per memory, a link plus a hook. The resume
sequence (B5) opens this index every session and opens only the full files it points to
that look relevant, so the always-on cost stays proportional to the number of memories,
not their size -- and, unlike an auto-loaded context file, the read is an explicit step
the agent runs, not something the environment does on its own.

The discipline (rule: `.claude/rules/long-term-memory.md`): save durable decisions the
moment they happen, not at session close; check the index before creating so facts are
updated, never duplicated; delete memories proven wrong; absolute dates only.

The boundary with B5 is deliberate: briefings hold in-flight state and die at the next
resume; memory holds permanent facts and lives until proven wrong. Never store in one
what belongs in the other.

Enforcement: a **rule**, like B5 -- whether a fact is durable is a judgment no
deterministic hook can make.

## B7 -- Work tracking: one branch, one issue, one pull request

Every unit of work is traceable end to end, not reconstructed after the fact from
commit messages. Before starting new work, the agent opens an issue describing it,
branches from that issue, and opens one pull request that closes it on merge (rule:
`.claude/rules/work-tracking.md`). A batch of small, related fixes may share one
umbrella issue with a checklist rather than one issue per item, but the branch and PR
still trace back to a single issue either way.

If the environment has no configured access to the project's issue tracker, the agent
says so plainly and proceeds with just the branch and PR, noting in the PR description
that no issue was opened -- a degraded mode called out explicitly, not a silent skip.

Enforcement: a **rule** -- opening the issue is a step in the agent's own workflow, not
something a hook can force before a commit exists to intercept.
