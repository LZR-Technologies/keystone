# Changelog

All notable changes to Keystone are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] — 2026-07-05

Documentation clarity pass — no behavior change.

### Changed

- **Quick start now shows both ways to run the tool** and steers away from the common mistake. It
  leads with `npx @lzr-technologies/keystone new my-app` (run without installing), keeps the global
  `npm i -g` install, and adds an explicit warning that the `npm i` box shown at the top of the npm
  page (without `-g`) installs Keystone as a folder dependency and never creates the `keystone`
  command — so `keystone new` won't run afterwards.
- Spells out that the command is the full **`keystone new`**, not `new` on its own, and that `new`
  **asks the user for the project name and the destination folder** — Keystone never picks the
  location itself.

## [0.1.1] — 2026-07-05

Documentation honesty pass — no behavior change.

### Changed

- **README terminal walkthrough** now mirrors the real command output, captured from actual runs of
  `keystone new` and `keystone check`, instead of an idealized transcript the tool never prints.
- **README and `docs/pillars.md` describe Layer A accurately.** The earlier wording understated what
  ships: the templates already lay most of the foundation into every generated project (the example
  database with its conventions, tests, the working branches, the deploy pipelines, the formatter and
  checkers, the visual system, responsiveness). What remains on the roadmap is the _automatic,
  command-driven_ enforcement of the rest, plus a handful of capabilities not yet in the template
  (country formatting, translation, an API guide, one-step rollback, edge protection, the review gate).

## [0.1.0] — 2026-07-03

The first working release. Three commands are usable end to end.

### Added

- **`keystone new`** — scaffolds a project from a real template (web or api), lays the Layer B
  agent harness on top, then takes it the last mile: initializes version control with a first
  commit and installs dependencies (which switches on the git hooks). `--no-git` and
  `--no-install` skip those steps.
- **`keystone check`** — runs three deterministic text guards (exposed secrets, oversized files,
  dangerous patterns) plus the project's own gates (formatter, linter, type-checker, tests, and a
  dependency-vulnerability audit), blocking when any fails. `--no-gates` runs only the fast guards.
- **`keystone analyze`** — measures an existing project against the standard, read-only.
- Continuous integration for Keystone itself: on every push and pull request the tool builds and
  runs its own `check` on its own repository.

### Security

- The secret scanner now detects **OpenAI** and **Anthropic** API keys by their shape, alongside
  the existing AWS, Stripe, GitHub, Slack, and private-key patterns.
- Every guard message now points at the relevant documentation, so a block says which rule it
  enforces, not just what tripped.

### Changed

- Project names are validated up front against npm package-name rules; an invalid name (spaces,
  uppercase) is rejected before anything is created.
- Choosing a project type with no template yet (mobile) is reported immediately, not after the
  whole setup questionnaire.
- The creation summary and the `keystone.json` record now describe recorded-only choices honestly,
  instead of implying they were already provisioned.
- The recorded `keystoneVersion` is read from the tool's own manifest rather than hardcoded, so it
  never drifts from the real version.
- `analyze` shows a project with no database as **not applicable**, not a green pass.
- The tests gate runs `test:coverage` when a project defines it, falling back to `test` otherwise.

[0.1.2]: https://github.com/LZR-Technologies/keystone/releases/tag/v0.1.2
[0.1.1]: https://github.com/LZR-Technologies/keystone/releases/tag/v0.1.1
[0.1.0]: https://github.com/LZR-Technologies/keystone/releases/tag/v0.1.0
