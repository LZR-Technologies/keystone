# LZR Platform Roadmap

> Documento mestre das melhorias de **plataforma** LZR — tudo que afeta como criamos código (templates, configs compartilhadas, CI reutilizável, skill `/new-project`, governança).
>
> Este NÃO é o backlog de produtos (Brand, Green Copilot, etc). Aqueles vivem em cada repo de produto.

## Filosofia

A plataforma existe pra **acelerar o time, não atrasar**. Investimos em melhorias quando:

1. **Há dor real** — algum produto LZR sentiu o impacto da falta dela
2. **O ROI é claro** — esforço de implementação << ganho operacional
3. **A maturidade do produto pede** — não adianta ter Lighthouse CI antes de ter um cliente pagante

> Cair em "platform engineering" antes do produto ter tração é antipattern clássico. Esse roadmap é deliberadamente **demand-driven**, não aspiracional.

## Categorização

Cada melhoria entra numa de 3 camadas:

| Camada | Quando atacar | Critério |
|--------|---------------|----------|
| 🔴 **Crítico** | Quando primeiro produto LZR tiver 2-3 clientes pagantes | "Sem isso o produto pode quebrar em prod sem ninguém ver" |
| 🟡 **Importante** | Quando primeiro produto tiver 10+ clientes ou segundo produto ativo | "Eleva muito a qualidade percebida e a velocidade do time" |
| 🟢 **Refinos** | Quando houver dor específica ou time de plataforma dedicado | "Excelência opcional, custo-benefício varia muito" |

## Roadmap por camada

### 🔴 Crítico

- **#7** Dependabot + CodeQL + npm audit nos templates *(security baseline)*
- **#8** Coverage threshold no `ci.yml` reutilizável (mínimo 80%, falha PR abaixo)
- **#9** Setup de observabilidade padronizado — Sentry + structured logs (helper `@lzr/observability`)

### 🟡 Importante

- **#10** Bundle size tracking + Lighthouse CI — performance budget enforced
- **#11** Axe-core no CI dos templates web — accessibility automatizada
- **#12** Setup de feature flags — recomendação + helper (GrowthBook ou Unleash)
- **#13** Preview deployments por PR — Vercel preview env documentado nos templates
- **#14** Generate OpenAPI spec inicial em projetos API — passo extra na skill
- **#15** Storybook setup no `lzr-template-web-next` — UI components com docs vivas

### 🟢 Refinos

- **#16** Mutation testing opcional via Stryker — workflow reutilizável
- **#17** Dev container (`.devcontainer.json`) nos templates — onboarding <10min
- **#18** Secrets em vault (Doppler ou Infisical) — alternativa a `.env.local`

## Bugs descobertos (não-roadmap, mas vivem aqui pra rastrear)

- **#19** [bug] CI dos templates falha com pnpm — alinhar com correções aplicadas no `lzr-brand`
- **#20** [bug] `eslint.config.mjs` importa `globals` mas não declara em devDependencies
- **#21** [bug] `package.json` dos templates sem `"packageManager"` declarado

## Como usar este documento

- **Adicionar item**: abrir issue no `lzr-github-ops` com label `platform` + `priority:critical|important|refinement` + `area:*` apropriada. Atualizar este doc com `#NÚMERO`.
- **Atacar item**: mover issue pra `Em andamento` no [board LZR Platform Roadmap](https://github.com/users/LZR-Tech/projects/4). Workflow do project-router faz isso automaticamente quando você abre PR vinculado.
- **Reordenar prioridade**: editar este doc + a label da issue. O doc é o storyteller; o board é o tracker operacional.

## Convenções

### Labels

- `platform` — todas as issues de melhoria de plataforma (vs `bug`, `feat`, etc.)
- `priority:critical` / `priority:important` / `priority:refinement`
- `area:ci` / `area:templates` / `area:skill` / `area:observability` / `area:security` / `area:testing` / `area:performance`

### Definition of Done para item de plataforma

1. Mudança propagada nos templates (web + api) onde aplicável
2. Mudança propagada na skill `/new-project` se for setup-time
3. Documentação no Engineering Handbook v2.X (ou ADR se for decisão arquitetural)
4. Versão do Handbook incrementada (governance.md changelog)
5. Issue fechada → automaticamente vai pra `Feito` no board
