# @lzr/eslint-config

Configuração ESLint compartilhada da **LZR Technologies** — flat config (ESLint 9+).

Baseado no [Engineering Handbook](https://code.lzrtechnologies.com).

## Instalação

```bash
npm install -D github:LZR-Tech/lzr-eslint-config
# Mais peer-deps que precisam estar no projeto:
npm install -D eslint @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import
```

## Uso

### Projeto Node/API

`eslint.config.mjs`:

```js
import { node } from '@lzr/eslint-config'

export default [
  ...node,
  { ignores: ['dist/', 'node_modules/', 'coverage/'] },
]
```

### Projeto Next.js / React

`eslint.config.mjs`:

```js
import { react } from '@lzr/eslint-config'

export default [
  ...react,
  { ignores: ['.next/', 'node_modules/', 'coverage/', 'out/'] },
]
```

## Exports disponíveis

| Export | Stack | O que inclui |
|--------|-------|-------------|
| `base` | Qualquer TypeScript | Zero `any`, imports organizados, naming conventions |
| `node` | APIs Node.js | Base + `no-magic-numbers` (warning) |
| `react` | React / Next.js | Base + JSX rules (`jsx-no-target-blank`, `self-closing-comp`) |

## Histórico

Originalmente fazia parte do monorepo `LZR-Tech/lzr-shared-config`. Separado em 2026 para resolver problemas de resolução de imports quando instalado via `github:` deps.

## Referência

- [LZR Engineering Handbook](https://code.lzrtechnologies.com)
