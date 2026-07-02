# @repo/prettier-config

Shared Prettier configuration.

## Installation

```bash
npm install -D github:your-org/prettier-config prettier prettier-plugin-tailwindcss
```

## Usage

In your project's `package.json`:

```json
{
  "prettier": "@repo/prettier-config"
}
```

## Rules

- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- Trailing comma everywhere (`trailingComma: "all"`)
- 100 characters per line (`printWidth: 100`)
- 2-space indentation (`tabWidth: 2`)
- `prettier-plugin-tailwindcss` plugin for class sorting

## History

Originally part of the `your-org/shared-config` monorepo. Split out in 2026 to resolve import resolution issues when installed via `github:` deps.

## Reference
