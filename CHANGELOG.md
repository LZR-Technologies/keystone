# Changelog

All notable changes to Keystone are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.7] — 2026-07-06

### Added

- **A sign of life during install.** The slow dependency-install step now shows a spinner in a
  terminal, turning into a check when it finishes — a fresh project's install used to sit silent and
  look frozen. Off a TTY (piped or scripted) it stays quiet, printing one line per step as before.
- **Folder suggestions in the wizard.** The parent-folder question shows concrete, predictable paths
  (the current folder and your home) right in the prompt, so there's a real path to copy or adapt
  instead of guessing — deterministic and cross-platform (no OS-specific "Documents").

### Changed

- **`--no-install` is discoverable.** Its help entry now says plainly that it skips the slow install
  for a fast scaffold (the project is still created and versioned), and the README's terminal section
  points to it for anyone in a hurry.

## [0.1.6] — 2026-07-06

### Added

- **Non-interactive creation.** `new` now accepts every answer as a flag (`--type`, `--language`,
  `--screen`, `--sensitive`, `--multi-tenant`/`--super-admin`/`--audit-log`, `--version-target`,
  `--private`, `--dir`), so an AI agent or a script can create a project in one shot without the
  interactive wizard. When the flags are present the wizard is skipped; when absent, it runs as
  before. A partial or invalid flag fails with a clear message. This removes the reverse-engineering
  the paste-to-Claude flow needed to feed the wizard — the agent collects answers as cards and hands
  them over at once, silently.
- **An honest "Still to do by hand" notice at the end of creation.** Keystone now says out loud that
  it did NOT create the remote repository (version control is local only) nor the database (the need
  is recorded, never provisioned) — both are manual next steps. Before, this lived only in the docs.

### Changed

- The paste-to-Claude block in the README forces the latest version (`@latest`, avoiding a stale npx
  cache that served an old version in a real run), runs non-interactively and silently, and relays
  only the final path plus the notice.

## [0.1.5] — 2026-07-05

### Changed

- **Name normalization is now announced.** When creation adjusts a project name (case or spaces —
  e.g. "Optograph" → "optograph"), the wizard tells you the resulting name at that moment, instead
  of leaving the change to be noticed later in the created path. A name that needed no adjustment
  stays quiet. Closes the conscious gap from 0.1.4.

## [0.1.4] — 2026-07-05

A creation-experience pass, driven by a real first-run of the paste-to-Claude path.

### Changed

- **Project names are normalized, not rejected.** A human name like "Optograph" or "My App" is
  lowercased and space-hyphenated to a valid package name (`optograph`, `my-app`) instead of being
  turned away. A name still invalid after that (a leading dot, stray symbols) fails with a clear
  message.
- **The wizard no longer asks about visual identity.** Appearance belongs to the (still-planned)
  design layer, not to creation — and the old "pick your look" question was ambiguous (it read as
  light/dark to some). Creation stays about structure; a project starts with the template's neutral
  default look. Docs reconciled.

### Added

- **The paste-to-Claude block asks the language first** (so it drives in the reader's own language
  even when pasted in English), drops the removed look question, and asks the assistant to offer
  folder suggestions and confirm the exact path before creating — never a silent location, never a
  bare `y`.

## [0.1.3] — 2026-07-05

### Added

- **An assistant-driven creation path in the Quick start.** The README now offers two ways to start:
  a ready-to-paste block you drop into your Claude Code chat — the agent asks the setup questions as
  clickable option cards, validates them (rejects a bare `y` for the destination folder and confirms
  the location), then installs Keystone and creates the project on its own, so you never touch the
  terminal — plus the existing terminal path (`npx` / global install) for those who prefer it. The
  pasted block also tells the agent to talk in the reader's own language.

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

[0.1.7]: https://github.com/LZR-Technologies/keystone/releases/tag/v0.1.7
[0.1.6]: https://github.com/LZR-Technologies/keystone/releases/tag/v0.1.6
[0.1.5]: https://github.com/LZR-Technologies/keystone/releases/tag/v0.1.5
[0.1.4]: https://github.com/LZR-Technologies/keystone/releases/tag/v0.1.4
[0.1.3]: https://github.com/LZR-Technologies/keystone/releases/tag/v0.1.3
[0.1.2]: https://github.com/LZR-Technologies/keystone/releases/tag/v0.1.2
[0.1.1]: https://github.com/LZR-Technologies/keystone/releases/tag/v0.1.1
[0.1.0]: https://github.com/LZR-Technologies/keystone/releases/tag/v0.1.0
