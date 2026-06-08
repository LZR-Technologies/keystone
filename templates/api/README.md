# lzr-template-api-node

Template oficial para APIs em **TypeScript/Node** da LZR Technologies.

Baseado no [Engineering Handbook](https://code.lzrtechnologies.com).

## Stack

| Tecnologia | Função |
|------------|--------|
| **TypeScript** | Linguagem (strict mode, zero any) |
| **Fastify** | Framework HTTP |
| **Zod** | Validação de schemas |
| **Pino** | Logging estruturado (JSON) |
| **Vitest** | Testes unitários e integração |
| **ESLint + Prettier** | Linting e formatação (@lzr/configs) |
| **CommitLint + Husky** | Conventional commits |

## Quick Start

### 1. Criar projeto a partir deste template

Clique em **"Use this template"** no GitHub, ou:

```bash
gh repo create meu-projeto --template LZR-Tech/lzr-template-api-node --public --clone
cd meu-projeto
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Edite .env.local com suas configurações
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
# 🚀 Server running on http://0.0.0.0:3000
```

### 5. Verificar

```bash
curl http://localhost:3000/api/v1/health
```

## Estrutura de pastas

```
src/
├── config/          # Configurações (env, logger)
│   ├── env.ts       # Validação de env vars (Zod)
│   └── logger.ts    # Logger estruturado (Pino)
├── features/        # Features organizadas por domínio
│   └── health/      # Exemplo: health check
│       ├── health.controller.ts
│       └── index.ts
├── shared/          # Código compartilhado
│   ├── middleware/   # Middlewares globais
│   │   └── error-handler.ts  # RFC 9457
│   ├── types/        # Types globais
│   │   ├── error.ts  # AppError + Problem Details
│   │   ├── result.ts # Result Pattern
│   │   └── index.ts
│   └── utils/        # Utilitários
└── index.ts          # Entry point (bootstrap)
```

## Criando uma nova feature

```bash
mkdir -p src/features/companies
```

```
src/features/companies/
├── companies.controller.ts   # Rotas
├── companies.service.ts      # Lógica de negócio
├── companies.types.ts        # Types e schemas Zod
├── companies.validation.ts   # Validações de input
├── __tests__/                # Testes da feature
│   └── companies.test.ts
└── index.ts                  # Barrel export
```

## Padrões do Handbook

| Padrão | Implementação |
|--------|---------------|
| **Zero any** | TSConfig strict + ESLint rule |
| **Result Pattern** | `ok(data)` / `fail(error)` em `shared/types` |
| **RFC 9457** | Error handler retorna Problem Details |
| **Zod validation** | Todo input externo validado |
| **Structured logging** | Pino JSON com trace_id |
| **Feature-based** | Código organizado por domínio |
| **Barrel exports** | `index.ts` em cada feature |

## Scripts

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Dev server com hot reload |
| `npm run build` | Compila TypeScript |
| `npm start` | Roda build em produção |
| `npm run typecheck` | Verifica tipos |
| `npm run lint` | Roda ESLint |
| `npm run test` | Roda testes |
| `npm run test:coverage` | Testes com cobertura (>80%) |

## Referência

- [LZR Engineering Handbook](https://code.lzrtechnologies.com)
- [Fastify](https://fastify.dev/)
- [Zod](https://zod.dev/)
