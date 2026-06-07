# Keystone

> Start a project that is born to professional standards — without building the foundation by hand.

*Keystone — the stone that holds the whole arch together. A project's foundation, in place from day one.*

**Status: in development.** The design is complete, and the core already works: `new` scaffolds a
project, `check` runs the automated guards, and `analyze` measures an existing project against the
standard. More is being layered on toward a first release.

## What it is

A family of commands that scaffolds a new software project with professional foundations already
built in — and stays with the project through its life. For **solo developers and small teams** who
want to start right and fast, without having to be experts in project setup.

It is **not an AI product and does not charge for AI**: everything that ships by default is
deterministic and free (formatting, guards, tests, rules). When intelligence helps (deriving the
visual identity, judging an analysis), it uses the AI assistant the developer already codes with —
never a paid layer of its own.

The full rationale, the **8 quality pillars**, the product soul and the build plan are in [docs/](docs/).

## Requirements

- **Node.js 24+** — it runs the TypeScript sources directly. No build step, no dependencies.

## Usage

```bash
# create a new project (asks a few questions)
node src/index.ts new my-app

# run the automated guards over a project (exposed secrets, oversized files)
node src/index.ts check .

# measure an existing project against the standard (read-only)
node src/index.ts analyze .
```

Once published, these become `keystone new`, `keystone check`, `keystone analyze`.

## Development

```bash
node --test tests/*.test.ts   # run the test suite
node src/index.ts check src   # Keystone runs its own guards and passes
```

## The 8 pillars

Foundation · Code quality · Database · Tests · Workflow · Ship it · Security · Documentation.
Each is detailed in [docs/pilares.md](docs/pilares.md).

## Contributing

Open to the community, with the maintainer in control — nothing lands unreviewed.
See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) — © 2026 Paulo de Lucca. Free to use, modify, and distribute, including commercially.
