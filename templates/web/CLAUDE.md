# Web project — AI instructions

> Read automatically by the coding agent before any task. Keep it lean: stack,
> conventions, and where to look. Details live on demand in `docs/` and `.claude/`.

## Language

- Code, identifiers, comments, and commits in English.

## Agent harness (Layer B)

This project is born with a harness for the AI that builds it. Full map in
[docs/agent-harness.md](docs/agent-harness.md).

- **Ritual (B2):** every feature opens with `specs/<slug>/spec.md` — the request restated
  plus a **verifiable "done" target**, approved before any code. On completion the work is
  checked against that target point by point; a gap is declared, not hidden. When code and
  spec diverge, the spec wins.
- **Reviewers (B3):** `.claude/agents/` — spec reviewer, code reviewer, security auditor,
  each in its own isolated context.
- **Guardrails (B4):** `.claude/hooks/` blocks committing a secret and touching a protected
  branch. Real rails, not warnings.

## Stack

| Package               | Purpose                |
| --------------------- | ---------------------- |
| next                  | Framework (App Router) |
| react                 | UI                     |
| typescript            | Language (strict mode) |
| tailwindcss           | Styling                |
| @tanstack/react-query | Server state           |
| react-hook-form + zod | Forms + validation     |
| vitest                | Unit tests             |
| @playwright/test      | End-to-end tests       |

Do not add a dependency without checking the stack does not already cover it.

## Structure

```
src/
├── app/            # App Router (routes, layouts)
├── components/ui/  # Reusable UI components
├── hooks/          # Custom hooks
├── lib/            # Utilities, fetch, query config
├── types/          # Shared types
└── styles/         # Global CSS and design tokens
```

## Code conventions

- **TypeScript strict**, zero `any` — use `unknown` plus a type guard when needed.
- **Named exports** in components; a default export only where the framework requires one
  (`page.tsx`, `layout.tsx`, `route.ts`).
- **Server Components by default** — add `'use client'` only for real interactivity
  (state, effects, event handlers).
- **Data fetching with React Query** — never `useState` + `useEffect` for server data.
  `useState` is for UI state only (drafts, filters, `isEditing`).
- **Back navigation uses `router.back()`**, never a hardcoded route; `router.push()` is for
  moving forward to a new page.
- **Design tokens, not hardcoded colors** — no raw hex/rgb/hsl and no generic Tailwind color
  classes (`text-gray-*`); use the project's token classes so light/dark adapt on their own.
- **Comment the "why"** — a decision, a trade-off, a business rule, a workaround. Never the
  obvious.

## Security

- Never log secrets, tokens, or personal data.
- Secrets live in the environment, never in the repo.
- Validate every external input with a schema at the boundary; treat all incoming data as
  untrusted.
- Security headers are configured in `next.config.ts`.

## Zero tolerance for warnings and errors

Nothing ships with a lint error or warning, a type error, a failing test, or a broken build.
On finding one — even a pre-existing one — stop, fix it, confirm
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` is clean, then resume the task.
