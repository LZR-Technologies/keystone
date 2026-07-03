# Contributing

Thanks for considering a contribution. This project follows a small, strict
set of conventions so history stays readable and `main` stays deployable at
all times.

## Branch model

Three branch levels:

- **`main`** — the protected branch. Protected: changes arrive only through
  reviewed, CI-green pull requests, never a direct commit. Every merge
  deploys production.
- **`develop`** — the integration branch. Every merge deploys staging.
- **short-lived working branches** — where daily work happens
  (`feat/...`, `fix/...`), branched from `develop` and merged back via pull
  request.

## One branch = one issue = one PR

Every working branch exists to close exactly one issue and produces exactly
one pull request. The PR template requires a `Closes #<issue>` link. Scope
creep belongs in a new issue, not folded into the branch you already have
open — a PR that does two unrelated things is two PRs that happen to share
a diff.

## Commit messages

Conventional Commits, with a **required scope**:

```
<type>(<scope>): <description>
```

Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`,
`security`. The scope names the module or area the commit touches (for
example `feat(orders): add cancellation endpoint`). Commit messages are
linted by commitlint (`config/commitlint-config/`) and enforced by a Git
hook — an unscoped or wrongly-typed commit is rejected before it lands.

## Before you push

Run the same checks CI runs, so a red pipeline is never a surprise:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm run test:coverage   # 100% threshold, enforced
pnpm build
```

A pre-push hook already runs typecheck and tests automatically; running the
full list yourself first is faster than waiting for the hook to catch it.

## Tests

Every feature ships with its test in the same PR; every bug fix starts with
a failing test that reproduces the bug. See [tests/README.md](tests/README.md)
for the four-layer test pyramid this project follows.

## Code review

Pull requests are reviewed against: design (single responsibility, no
duplicated logic), edge cases and failure paths, test coverage, security
(input validation, tenant isolation, no leaked internals), performance, and
reviewability (small, focused diffs with a clear "why"). See
[CLAUDE.md](CLAUDE.md) for the full set of conventions this codebase
follows.
