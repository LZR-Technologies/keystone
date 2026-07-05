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
# (answers a few setup questions: type, language, screen, look, data sensitivity…)
✓ Project created at ./my-app
  From the web template
  Database (recorded): needed
  Security level (recorded): essential — noted in keystone.json for later

Finishing setup…
  ✓ initialize version control (main)
  ✓ stage the initial files
  ✓ record the first commit
  ✓ create the develop branch (daily work happens here)
  ✓ install dependencies (pnpm)

$ keystone check .
✓ Text guards passed — no issues found.

Project gates:
  ✓ [Code quality] formatting
  ✓ [Code quality] lint (errors & warnings)
  ✓ [Code quality] types
  ✓ [Tests] tests
  ✓ [Security] dependency audit
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

## Commands

Keystone has three commands:

- **`new`** scaffolds a project, lays in the Layer B harness, then takes it the last mile — starts
  version control with a first commit, installs dependencies, and (through that install) switches on
  the git hooks. `--no-git` / `--no-install` skip those steps.
- **`check`** runs three deterministic text guards (exposed secrets, oversized files, dangerous
  patterns) **plus the project's own gates**, blocking when any fails. `--no-gates` runs only the
  fast guards.
- **`analyze`** measures an existing project against the standard (read-only).

Layer A arrives on two levels, and it is worth being precise about which is which. **The templates
lay in most of the foundation**, so every generated project is born with it: the fixed structure,
an example database with the data conventions baked in (automatic timestamps, soft delete,
non-sequential IDs, per-tenant isolation, an audit log), tests covering the happy and unhappy
paths, the three working branches, per-environment deploy pipelines with secrets kept out of the
code, the formatter and checkers, a token-based visual system, and responsiveness. **What a command
enforces automatically today is narrower** — `check` runs the text guards plus the project's own
gates (format, lint, types, tests, dependency audit), blocking on failure. What is genuinely still
on the roadmap is the _automatic_ enforcement of the rest, plus a handful of capabilities not yet
in the template — country-format dates and money, the translation layer, an API usage guide,
one-step rollback, edge abuse-protection, and the pre-merge review gate. It is all tracked per
pillar in [docs/pillars.md](docs/pillars.md).

## Quick start

Keystone is a command-line tool that _creates_ projects, so you run it **as a command** — not as a
project dependency. There are two ways to run it.

**Without installing anything** (simplest — nothing is left on your machine):

```bash
npx @lzr-technologies/keystone new my-app
```

**Or install it once, globally**, then call `keystone` from any folder:

```bash
npm i -g @lzr-technologies/keystone
keystone new my-app       # create a project — it asks you the name and where to put it
keystone check .          # text guards + the project's own gates (block on failure)
keystone analyze .        # measure an existing project (read-only)
```

> **Heads up — don't copy the box at the top of the npm page.** That `npm i @lzr-technologies/keystone`
> (without `-g`) adds Keystone as a _dependency of the current folder_, which is **not** what you want:
> it installs the tool but never creates the `keystone` command, so `keystone new` won't run afterwards.
> Keystone _builds_ projects; it is not a library you add to one. Use `npx` or the global install above,
> and type the whole command **`keystone new`** — `new` on its own is not a command.

When you run `new`, Keystone **asks you the project name and the folder to create it in** — you choose
both. It never picks the location for you, so the project lands wherever _your_ machine keeps its work.

The package ships under the **`@lzr-technologies`** organization as **`@lzr-technologies/keystone`**
(`keystone` alone is taken; publishing under the org scope keeps the whole product line clearly LZR's);
the command you type stays `keystone`.

**From source** — to run the latest or to contribute:

```bash
git clone <this-repo-url>
cd keystone
npm install
node src/index.ts new my-app     # runs the TypeScript sources directly (needs Node 24)
node src/index.ts check .
```

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
