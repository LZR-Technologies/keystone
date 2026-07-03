# Security Pillar — detailed rule

> **What this is:** the Security pillar spelled out in full. It takes the skeleton
> ([pillars.md](pillars.md)) into an actionable rule. Baseline **essential** level (what every
> project ships with); the reinforced level kicks in when the project is sensitive.
>
> **Status — what is actually built today:** only three commands exist — `new` (scaffolds a
> project), `check` (three text guards over files — exposed secrets, oversized files, dangerous
> patterns — plus the project's own gates: format, lint, types, tests, and a **dependency audit**),
> and `analyze` (read-only, reports only: six presence checks — exposed secrets, .gitignore
> completeness, presence of tests, presence of a README, basic database-convention text checks,
> oversized files). Everything else in this document — tenant-filter query checks, edge enforcement, a
> pre-publish gate, and the AI vulnerability hunt — is the **target**, not built. The security-relevant
> checks that run today are the exposed-secret scan, the dangerous-pattern scan, and the dependency
> audit (all marked 🔧 below). Grounded in the references chosen for relevance to typical web-app
> projects (listed at the end).

---

## Principle

**Security in code, not in a paid agent:** the aim is for it to run on its own, at zero cost, with no
dependency on a paid AI service. Two fronts, weighted differently:

- **Application-layer security** (the core) — squarely the application's own responsibility, and where mistakes most
  often occur.
- **Edge protection** (the perimeter) — hold back abuse. This is the standard the scaffold aims for; the
  edge protection is planned, not wired up as active enforcement today.

When AI enters the picture (deeper vulnerability hunting), the intent is for it to be the assistant the
developer already uses — optional and off by default. That deeper hunt is planned, not built.

## How a project starts secure — three layers (zero cost)

1. **Written rules** — this document.
2. **Automatic checks** — they read the code or run the project's own tooling. Three
   security-relevant checks run today via the `check` command: 🔧 exposed-secret scanning,
   🔧 dangerous-pattern scanning (injection/XSS sinks), and 🔧 the package manager's dependency
   audit as a blocking gate. Deterministic, no AI. _Planned:_ wiring the checks to run again
   automatically before publishing (a second net at the gate) is the standard the scaffold aims
   for, not built.
3. **Protection configuration** — sensible protection settings, on by default. _Planned:_ pre-tuned edge
   protection switched on by default is designed, not delivered.

---

## Front 1 — application-layer security (the core, essential)

### 1.1 Each customer sees only their own

The single most important rule in any multi-tenant system.

- Every record carries the **tenant id** (tenant isolation).
- Every database query **filters by the tenant id automatically** — the protection lives **in the
  database**, not only in the screen-facing code (which can have gaps). Never trust the application
  layer alone.
- A user with no tenant assigned is **blocked**, never allowed to "see everything".
- _Planned:_ a check that flags any database query missing the tenant filter is the target, not built.

### 1.2 Firm login

- Strong password required; password **stored hashed**, never in plain text.
- **Lockout after repeated failed attempts** (blocks mass guessing attacks).
- Sessions **expire** on their own; signing out truly ends the session.
- **Second factor** available, and required at the reinforced level.

### 1.3 Passwords and secrets kept safe

- Keys and secrets **never in the code or the repository** — they live outside, in the environment,
  stored securely and reusable (ties into "secrets out of the code" from the Ship it pillar).
- 🔧 A check **scans the code for exposed secrets** and flags any it finds. _Planned:_ turning that
  flag into a hard block before publishing is the standard the scaffold aims for, not built.

### 1.4 Only those allowed can act

- Every action verifies the user **has the right** to perform it.
- **Deny by default**: only what was explicitly granted is permitted.
- A regular user **cannot** perform an admin action (no privilege-escalation gap).

### 1.5 Never trust incoming input

- Everything that comes in (from the screen, from another system) is **treated as suspect** and
  validated.
- Protection against the classic attacks: a malicious command injected into a field, a malicious
  script that runs on another user's screen (injection and XSS).
- 🔧 A dangerous-pattern scan flags the classic sinks today — dynamic code execution, raw HTML
  injection (React escape hatch and direct DOM write), and shell commands built with interpolation.
  Deeper taint analysis (tracing untrusted input to a sink) is the target, not built.

### 1.6 Third-party components watched

- The list of third-party components should be **checked**; it should warn when one has a **known
  vulnerability**.
- Don't use an abandoned (unmaintained) component.
- 🔧 The `check` command runs the package manager's own **dependency audit** as a blocking gate, so a
  known-vulnerable dependency makes `check` fail. Deeper policy (flagging unmaintained components) is
  the target, not built.

### 1.7 Errors leak no clues

- The error message shown to the user is **discreet** — it never reveals paths, versions, or
  internal data.
- The detail goes to the **internal log**, not to the screen.

### 1.8 A trail of what happened

- Important actions leave a **record of who did what and when** (an audit log).
- The record **holds no sensitive data** (password, card number).
- It serves later auditing and investigation (ties into the timestamps from the Database pillar).

### 1.9 Hardened by default from the start

- No open door in the factory defaults.
- The connection is **always encrypted** (TLS), never in the clear.
- Browser protections on by default.

---

## Front 2 — edge protection (the perimeter)

_Planned, not built._ This is the edge standard the scaffold aims for; none of it runs as active
enforcement today.

- **Hold back excess access**: throttle anyone hammering the system to disrupt or overload it (rate
  limiting).
- **Hold back automated abuse**: make brute-force bots harder.
- The design keeps it on by default, with an off switch for anyone who doesn't want it.

---

## The levels

| Level          | When                                                    | What changes                                                                                   |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Essential**  | Every project, from day one                             | Items 1.1 to 1.9 + the basic edge                                                              |
| **Reinforced** | Sensitive project (personal data, money, health, legal) | Mandatory second factor, extra encryption, stricter logging, human review of sensitive changes |

The level is **derived** from the sensitivity question in the setup wizard
([setup-wizard.md](setup-wizard.md)). The reinforced controls above describe the reinforced
standard; the human review of sensitive changes depends on the review gate, which is planned, not
built.

## The AI layer (optional, the developer's own)

Deeper vulnerability hunting, carried out by the assistant the developer already uses to code —
**never a paid platform layer**. This is planned, not built: the integration point stays off by
default, and a project is meant to be secure without it.

---

## References (chosen for relevance to typical web-app projects)

- **OWASP ASVS** — application security verification standard (base for items 1.1–1.9). Mapping:
  1.1/1.4 → access control; 1.2 → authentication; 1.5 → validation; 1.7/1.8 → errors and logging;
  1.9 → configuration.
- **OWASP Cheat Sheet Series** — the "how to" for each item.
- **OWASP Web Security Testing Guide** — how to test.
- Automatic checks (built today): exposed-secret scanning + oversized-file scanning + dangerous-pattern
  scanning (injection/XSS sinks) + the dependency audit gate. _Planned:_ deeper taint analysis; edge
  rate limiting.

> Note: each item must be confirmed against the current ASVS version at the implementation phase.
