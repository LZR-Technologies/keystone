# LZR API Template — Instruções para IA

> **Engineering Handbook v2.4** — Toda alteração de regra segue `governance.md` (versionar → propagar → enforcement)
> Este arquivo é lido automaticamente pelo Claude Code antes de qualquer tarefa.

## Idioma
- **SEMPRE** responder em português brasileiro (pt-BR)
- Código e nomes de variáveis em inglês

## Referências autoritativas

| Documento | URL | O que define |
|-----------|-----|-------------|
| **Engineering Handbook v2.4** | https://code.lzrtechnologies.com | Arquitetura, padrões de código, CI/CD, segurança, governança |

Em caso de dúvida entre o que está no código e o que está nesses documentos, **o documento vence**.

---

## Configs compartilhadas (`@lzr/*`)

Este template herda 4 configs centralizadas da LZR-Tech. Vêm pré-instaladas via `npm install` e ativadas automaticamente — o dev não precisa fazer nada manual.

| Config | Repo fonte | O que controla |
|---|---|---|
| `@lzr/tsconfig` | [LZR-Tech/lzr-tsconfig](https://github.com/LZR-Tech/lzr-tsconfig) | Strict mode TS, paths, target, lib |
| `@lzr/eslint-config` | [LZR-Tech/lzr-eslint-config](https://github.com/LZR-Tech/lzr-eslint-config) | Zero `any`, imports organizados, naming |
| `@lzr/prettier-config` | [LZR-Tech/lzr-prettier-config](https://github.com/LZR-Tech/lzr-prettier-config) | Aspas simples, sem `;`, 100 cols |
| `@lzr/commitlint-config` | [LZR-Tech/lzr-commitlint-config](https://github.com/LZR-Tech/lzr-commitlint-config) | Conventional Commits |

**Para mudar uma regra que afeta todos os projetos LZR**: abrir PR no repo correspondente acima. Não duplique a regra localmente.

**Para override pontual** (ex.: desativar uma rule num arquivo): documente o motivo com `// eslint-disable-next-line ... -- Why: ...`.

---

## Stack

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| fastify | ^5 | Framework HTTP |
| zod | ^3 | Validação |
| pino | ^9 | Logging estruturado |
| typescript | ^5.6 | Linguagem |
| vitest | ^2 | Testes |

---

## Arquitetura

### Estrutura de pastas (feature-based)
```
src/
├── features/
│   ├── bids/
│   │   ├── bids.service.ts
│   │   ├── bids.controller.ts
│   │   ├── bids.types.ts
│   │   ├── bids.validation.ts
│   │   └── __tests__/
│   └── companies/
├── shared/
│   ├── utils/
│   ├── types/
│   └── middleware/
├── config/
└── index.ts
```

### Padrões obrigatórios

- **Result Pattern** — `ok(data)` / `fail(error)`, nunca throw para erros de negócio
- **Zod** para validação de toda entrada externa (API, forms, env vars)
- **RFC 9457** para respostas de erro
- **Logging estruturado** via Pino (JSON, com trace_id, tenant_id)
- **Zero `any`** — usar `unknown` + type guard

### TypeScript
- `strict: true` — sem exceções
- Named exports (nunca default)
- Barrel exports por feature (`index.ts`)

### Commits
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `security:`

---

## Regras de código

- **JSDoc obrigatório** em métodos públicos de service
- **Comentários explicativos** — decisões de arquitetura, trade-offs, workarounds, regras de negócio
- **Paginação obrigatória** — todo `getAll()` usa `.limit()` ou paginação cursor-based
- **Testes** — feature nova = teste novo
- **Segurança** — NUNCA logar senhas, tokens, CPF/CNPJ. Variáveis sensíveis em `.env.local`

---

## Super-admin (multi-tenant)

Em toda API multi-tenant da LZR, **super-admin é role explícito, NUNCA orphan**.

- Padrão técnico: `profiles.role = 'super_admin'` consultado por função SECURITY DEFINER `is_super_admin_user()`
- User sem `company_id` e sem role super_admin = orphan → **BLOQUEADO** (OWASP A01 — Broken Access Control)
- **NUNCA** usar `IS NULL OR company_id = ...` em policies (brecha cross-tenant)
- Endpoints sensíveis: validar scope/auth antes de retornar dados

---

## Zero tolerance a warnings/erros

Toda regra do Handbook é **enforced**. Nenhum PR pode ser mergeado com:

- Erro ou warning de lint
- Erro de type-check
- Teste falhando
- Build quebrado
- Cobertura abaixo de 80% nas features novas

**Procedimento ao detectar problema** (mesmo pré-existente):

1. Parar o trabalho atual
2. Corrigir TUDO (não só o arquivo tocado)
3. Validar `pnpm typecheck && pnpm lint && pnpm test && pnpm build` com **0 erros e 0 warnings**
4. Só então retomar a tarefa original

**Proibido**: ignorar com "pré-existente", "não toquei nesse arquivo", "arrumo depois".

---

## Governança de Regras (v2.4)

**REGRA PERPÉTUA**: Toda criação/edição/remoção de regra DEVE ser refletida em TODAS as fontes (7 passos).

> Referência: `Elementos-reutilizaveis/knowledge/frontend/governance.md`
