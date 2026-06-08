# lzr-template-web-next

Template oficial para apps web em **Next.js App Router** da LZR Technologies.

Baseado no [Engineering Handbook](https://code.lzrtechnologies.com).

## Stack

| Tecnologia | Função |
|------------|--------|
| **Next.js 15** | Framework (App Router) |
| **React 19** | UI (Server Components por padrão) |
| **TypeScript** | Linguagem (strict mode, zero any) |
| **Tailwind CSS** | Estilos |
| **React Query** | Client-side caching/polling |
| **Zustand** | Estado global mínimo |
| **React Hook Form + Zod** | Formulários + validação |
| **Vitest** | Testes unitários |
| **Playwright** | Testes E2E |

## Quick Start

### 1. Criar projeto a partir deste template

```bash
gh repo create meu-app --template LZR-Tech/lzr-template-web-next --public --clone
cd meu-app
```

### 2. Instalar e rodar

```bash
npm install
cp .env.example .env.local
npm run dev
# → http://localhost:3000
```

## Estrutura de pastas

```
src/
├── app/                     # Next.js App Router
│   ├── layout.tsx           # Root layout (i18n: pt-BR)
│   ├── page.tsx             # Home page
│   ├── providers.tsx        # Client providers (React Query)
│   ├── (auth)/              # Grupo de rotas: autenticação
│   │   └── login/
│   ├── (dashboard)/         # Grupo de rotas: área logada
│   └── api/v1/              # API routes
│       └── health/route.ts
├── components/              # Componentes React
│   ├── ui/                  # Design System (botões, inputs, etc)
│   ├── forms/               # Componentes de formulário
│   ├── layouts/             # Layouts reutilizáveis
│   └── features/            # Componentes por feature
├── hooks/                   # Custom hooks
├── lib/                     # Utilitários e configs
│   ├── fetch.ts             # Fetch wrapper (Result Pattern)
│   └── types.ts             # Types globais
└── styles/
    └── globals.css          # Tailwind + CSS variables
```

## Padrões do Handbook

| Padrão | Implementação |
|--------|---------------|
| **Server Components** | Padrão — só `'use client'` quando interatividade |
| **React Query** | Client caching via `providers.tsx` |
| **Zustand** | Estado global mínimo (adicionar conforme necessidade) |
| **React Hook Form + Zod** | Formulários tipados e validados |
| **Result Pattern** | `apiFetch()` em `lib/fetch.ts` |
| **RFC 9457** | Errors como Problem Details |
| **Security headers** | Configurados em `next.config.ts` |
| **Design tokens** | CSS variables em `globals.css` |

## Performance (Handbook: Core Web Vitals)

| Métrica | Target |
|---------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

- Sempre usar `next/image` com `sizes`
- Server Components por padrão
- Lazy load componentes pesados

## Scripts

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Dev server |
| `npm run build` | Build de produção |
| `npm run typecheck` | Verifica tipos |
| `npm run lint` | ESLint + Next.js lint |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes E2E (Playwright) |

## Referência

- [LZR Engineering Handbook](https://code.lzrtechnologies.com)
- [Next.js Docs](https://nextjs.org/docs)
- [React Query](https://tanstack.com/query)
