# Keystone

> **Every project, born to professional standards.** Not built by hand.

Keystone scaffolds a new codebase that already has the professional foundation in place — the
engineering setup, the AI-agent harness, and the experience-quality layer — **built by the AI you
already code with, tied to no vendor.** You don't configure it into shape. You start with it.

_Keystone — the stone that holds the whole arch together. A project's foundation, in place from day one._

## Why Keystone

Most tools help you _write_ code, _plan_ it, or _run_ an agent inside your editor. They all assume the
project already exists. Keystone gives you the part they skip: a project that is **already built right
the moment it exists** — standards, structure, guardrails, tests, and reviewers, in place from commit
zero. Nothing to wire up, no "best practices" to remember. And because the foundation is deterministic,
its quality **never depends on paid AI** — the agent that builds on top runs on the AI you already use.

```text
$ keystone new my-app
  ✓ Project created — professional foundation in place
  ✓ Agent harness laid in (context, specs, reviewers, guardrails, memory)
  ✓ Versioned, dependencies installed, git hooks live
$ keystone check .
  ✓ Text guards · format · lint · types · tests · dependency audit — all green
```

## Three layers

Keystone is three layers: _what_ gets built, _who_ builds it, and _how good it is to use_.

- **Layer A — Product Foundation** _(deterministic, zero-cost)_. The project starts solid without
  depending on AI: formatter, linter, type-checker, tests with examples, database migrations that
  embody the data conventions, git hooks, CI, and per-environment deploy workflows. `check` runs the
  text guards **plus the project's own gates** (format, lint, types, tests, dependency audit),
  blocking on failure.
- **Layer B — Agent Harness**. The project is built by the AI coding agent you already use. `new`
  lays in context-in-layers, spec-driven development with a verifiable "done" target, isolated-context
  reviewers (spec, code, security), guardrails that **block** (proven by test), session continuity,
  and the agent's long-term memory.
- **Layer C — Experience Quality**. A usable, accessible, consistent interface is part of "done" —
  enforced **neutrally**, never a specific look. Hard gates where a machine can decide (color
  contrast in a real browser, structural accessibility, mobile viewport); reviewers that recommend
  where it is judgment (hierarchy, the four states, keyboard access, visual consistency). The visual
  system stays **bring-your-own** — Keystone guards the quality, a design skill creates the look.

The line is deliberate: the foundation (A) is deterministic and free; the building agent (B) gets a
first-class harness that runs on **your** AI; and experience quality (C) is enforced without imposing
a house taste. No vendor lock-in on any layer.

## Status

**In development, and honest about it.** Three commands work today:

- **`new`** scaffolds a project, lays in the Layer B harness, then takes it the last mile — starts
  version control with a first commit, installs dependencies, and (through that install) switches on
  the git hooks. `--no-git` / `--no-install` skip those steps.
- **`check`** runs three deterministic text guards (exposed secrets, oversized files, dangerous
  patterns) **plus the project's own gates**, blocking when any fails. `--no-gates` runs only the
  fast guards.
- **`analyze`** measures an existing project against the standard (read-only).

Most of Layer A's pillars are built; the rest are the target, flagged per pillar in
[docs/pillars.md](docs/pillars.md). This README makes no claim beyond what the docs say is built.

## Quick start

Not yet published to a registry. Until it ships, run Keystone from the repo:

```bash
git clone <this-repo-url>
cd keystone
npm install
node src/index.ts new my-app     # scaffold a project
node src/index.ts check .         # text guards + the project's own gates (block on failure)
node src/index.ts analyze .       # measure an existing project (read-only)
```

Closer to the real install experience, from a local tarball:

```bash
npm run build                     # compile src/ → dist/ (what the package ships)
npm pack                          # produces a .tgz in the repo root
npm i -g ./lzr-keystone-*.tgz
keystone new my-app
```

Once published, installation becomes `npm i -g lzr-keystone`, and the commands stay
`keystone new my-app`, `keystone check .`, `keystone analyze .`. The public package name is
**`lzr-keystone`** (`keystone` alone is taken; the `lzr-` prefix names the product line); the command
you type stays `keystone`.

## Requirements

- **Node.js 20+** for the installed package, **24+** to run from the repository — and no runtime
  dependencies either way. From the repo, Keystone runs its TypeScript sources directly (that needs
  Node 24). Installed as a package, it runs compiled JavaScript on Node 20+, because Node refuses to
  run TypeScript from under `node_modules`, so the published package ships a built `dist/`. Projects
  Keystone generates also target Node 20+, so the tool never demands a newer runtime than the projects
  it creates.
- **A package manager for the generated project's install.** `new` picks the manager from the
  template's lockfile — the current templates ship a `pnpm-lock.yaml`, so **[pnpm](https://pnpm.io)**
  is required for that step (`npm i -g pnpm`), or run `keystone new --no-install` and install yourself.

## Development

```bash
npm run build                 # compile src/ → dist/ (what the package ships)
node --test tests/*.test.ts   # run the test suite
node src/index.ts check .     # Keystone runs its own checks and passes
```

## Layer A — the 8 pillars

Foundation · Code quality · Database · Tests · Workflow · Ship it · Security · Documentation.
Each is detailed in [docs/pillars.md](docs/pillars.md). The full rationale, product design, and build
plan are in [docs/](docs/).

## Contributing

Open to the community, with the maintainer in control — nothing lands unreviewed.
See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) — © 2026 Paulo de Lucca. Free to use, modify, and distribute, including commercially.
