# Web template

An official starting point for web apps on **Next.js App Router**.

## Stack

| Technology                | Role                               |
| ------------------------- | ---------------------------------- |
| **Next.js 15**            | Framework (App Router)             |
| **React 19**              | UI (Server Components by default)  |
| **TypeScript**            | Language (strict mode, zero `any`) |
| **Tailwind CSS**          | Styling                            |
| **React Query**           | Client-side caching / polling      |
| **Zustand**               | Minimal global state               |
| **React Hook Form + Zod** | Forms + validation                 |
| **Vitest**                | Unit tests                         |
| **Playwright**            | End-to-end tests                   |

## Quick start

### 1. Create a project from this template

```bash
gh repo create my-app --template your-org/template-web --public --clone
cd my-app
```

### 2. Install and run

```bash
pnpm install
cp .env.example .env.local
pnpm dev
# → http://localhost:3000
```

## Folder structure

```
src/
├── app/                     # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── providers.tsx        # Client providers (React Query)
│   └── api/v1/              # API routes
│       └── health/route.ts
├── components/              # React components
│   ├── ui/                  # Design System (buttons, inputs, etc.)
│   ├── forms/               # Form components
│   ├── layouts/             # Reusable layouts
│   └── features/            # Feature-specific components
├── hooks/                   # Custom hooks
├── lib/                     # Utilities and config
│   ├── fetch.ts             # Fetch wrapper (result pattern)
│   └── types.ts             # Shared types
└── styles/
    └── globals.css          # Tailwind + CSS variables
```

## Conventions

| Convention                | Where                                           |
| ------------------------- | ----------------------------------------------- |
| **Server Components**     | Default — `'use client'` only for interactivity |
| **React Query**           | Client caching via `providers.tsx`              |
| **Zustand**               | Minimal global state (add as needed)            |
| **React Hook Form + Zod** | Typed, validated forms                          |
| **Result pattern**        | `apiFetch()` in `lib/fetch.ts`                  |
| **RFC 9457**              | Errors as Problem Details                       |
| **Security headers**      | Configured in `next.config.ts`                  |
| **Design tokens**         | CSS variables in `globals.css`                  |

## Performance (Core Web Vitals)

| Metric | Target  |
| ------ | ------- |
| LCP    | < 2.5s  |
| INP    | < 200ms |
| CLS    | < 0.1   |

- Always use `next/image` with `sizes`
- Server Components by default
- Lazy-load heavy components

## Scripts

| Script           | What it does                  |
| ---------------- | ----------------------------- |
| `pnpm dev`       | Dev server                    |
| `pnpm build`     | Production build              |
| `pnpm typecheck` | Type check                    |
| `pnpm lint`      | ESLint + Next.js lint         |
| `pnpm test`      | Unit tests (Vitest)           |
| `pnpm test:e2e`  | End-to-end tests (Playwright) |

## Reference

- [Next.js Docs](https://nextjs.org/docs)
- [React Query](https://tanstack.com/query)
