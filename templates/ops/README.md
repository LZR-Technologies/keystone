# lzr-github-ops

Workflows reutilizáveis do GitHub Actions e templates de governança da **LZR Technologies**.

Baseado no [Engineering Handbook](https://code.lzrtechnologies.com).

## Workflows Reutilizáveis

### CI Pipeline (`ci.yml`)

Pipeline completa: typecheck → lint → test → build

```yaml
# No seu repo, crie .github/workflows/ci.yml:
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    uses: LZR-Tech/lzr-github-ops/.github/workflows/ci.yml@main
    with:
      node-version: '20'
      package-manager: 'npm'
      run-e2e: false
```

### Security Scan (`security.yml`)

Audit de dependências + CodeQL analysis

```yaml
name: Security
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 9 * * 1'  # Toda segunda às 9h

jobs:
  security:
    uses: LZR-Tech/lzr-github-ops/.github/workflows/security.yml@main
```

### Release (`release.yml`)

Release automatizada com changelog

```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  release:
    uses: LZR-Tech/lzr-github-ops/.github/workflows/release.yml@main
```

## Templates

### Para copiar no seu repo

| Template | Destino | Descrição |
|----------|---------|-----------|
| `templates/repo-files/CODEOWNERS` | `.github/CODEOWNERS` | Ownership por área |
| `templates/docs/ADR-000-template.md` | `docs/adrs/ADR-000-template.md` | Template de ADR |
| `templates/docs/service-runbook.md` | `docs/runbooks/service-runbook.md` | Runbook operacional |

### Issue & PR Templates

Já inclusos em `.github/`:
- **Bug Report** — com severidade (SEV-1 a SEV-4)
- **Feature Request** — com critérios de aceite
- **Pull Request Template** — checklist baseado no handbook

## Como usar

1. Copie os workflows para `.github/workflows/` do seu repo
2. Copie o CODEOWNERS para `.github/CODEOWNERS`
3. Copie os templates de docs para `docs/`
4. Ajuste owners e configurações conforme o projeto

Ou use os **templates oficiais** ([lzr-template-api-node](https://github.com/LZR-Tech/lzr-template-api-node), [lzr-template-web-next](https://github.com/LZR-Tech/lzr-template-web-next)) que já vêm com tudo configurado.

## Referência

- [LZR Engineering Handbook](https://code.lzrtechnologies.com)
