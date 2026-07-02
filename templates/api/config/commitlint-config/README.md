# @repo/commitlint-config

CommitLint configuration — Conventional Commits.

## Installation

```bash
npm install -D github:your-org/commitlint-config @commitlint/cli @commitlint/config-conventional
```

## Usage

`commitlint.config.js`:

```js
module.exports = { extends: ['@repo/commitlint-config'] }
```

## Allowed types

`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `security`, `style`, `perf`, `ci`, `build`, `revert`

## Main rules

- Header maximum: 100 characters
- Type is required and lowercase
- Subject is required (no leading uppercase)

### Valid examples

```
feat: adds dashboard feature
fix: corrects timeout bug
security: fixes SQL injection
```

## History

Originally part of the `your-org/shared-config` monorepo. Split out in 2026 to resolve import resolution issues when installed via `github:` deps.

## Reference

- [Conventional Commits](https://www.conventionalcommits.org/)
