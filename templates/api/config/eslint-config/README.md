# @repo/eslint-config

ESLint configuration (shared, flat config, ESLint 9+).

## Installation

```bash
npm install -D github:your-org/eslint-config
# Additional peer deps that must be present in the project:
npm install -D eslint @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import
```

## Usage

### Node/API project

`eslint.config.mjs`:

```js
import { node } from '@repo/eslint-config'

export default [...node, { ignores: ['dist/', 'node_modules/', 'coverage/'] }]
```

### Next.js / React project

`eslint.config.mjs`:

```js
import { react } from '@repo/eslint-config'

export default [...react, { ignores: ['.next/', 'node_modules/', 'coverage/', 'out/'] }]
```

## Available exports

| Export  | Stack           | What it includes                                              |
| ------- | --------------- | ------------------------------------------------------------- |
| `base`  | Any TypeScript  | Zero `any`, organized imports, naming conventions             |
| `node`  | Node.js APIs    | Base + `no-magic-numbers` (warning)                           |
| `react` | React / Next.js | Base + JSX rules (`jsx-no-target-blank`, `self-closing-comp`) |

## History

Originally part of the `your-org/shared-config` monorepo. Split out in 2026 to resolve import resolution issues when installed via `github:` deps.

## Reference
