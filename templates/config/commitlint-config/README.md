# @lzr/commitlint-config

Configuração CommitLint da **LZR Technologies** — Conventional Commits.

Baseado no [Engineering Handbook](https://code.lzrtechnologies.com).

## Instalação

```bash
npm install -D github:LZR-Tech/lzr-commitlint-config @commitlint/cli @commitlint/config-conventional
```

## Uso

`commitlint.config.js`:

```js
module.exports = { extends: ['@lzr/commitlint-config'] }
```

## Tipos permitidos

`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `security`, `style`, `perf`, `ci`, `build`, `revert`

## Regras principais

- Header máximo: 100 caracteres
- Tipo obrigatório e em minúsculas
- Subject obrigatório (sem maiúsculas no início)

### Exemplos válidos

```
feat: adds dashboard feature
fix: corrects timeout bug
security: fixes SQL injection
```

## Histórico

Originalmente fazia parte do monorepo `LZR-Tech/lzr-shared-config`. Separado em 2026 para resolver problemas de resolução de imports quando instalado via `github:` deps.

## Referência

- [LZR Engineering Handbook](https://code.lzrtechnologies.com)
- [Conventional Commits](https://www.conventionalcommits.org/)
