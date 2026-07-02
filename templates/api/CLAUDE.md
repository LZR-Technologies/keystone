# Service (API) project — AI instructions

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

| Package    | Purpose                |
| ---------- | ---------------------- |
| fastify    | HTTP framework         |
| zod        | Validation             |
| pino       | Structured logging     |
| typescript | Language (strict mode) |
| vitest     | Tests                  |

Do not add a dependency without checking the stack does not already cover it.

## Structure (feature-based)

```
src/
├── features/
│   └── <feature>/
│       ├── <feature>.service.ts
│       ├── <feature>.controller.ts
│       ├── <feature>.types.ts
│       ├── <feature>.validation.ts
│       └── __tests__/
├── shared/         # utils, types, middleware
├── config/
└── index.ts
```

## Conventions

- **Result pattern** — return `ok(data)` / `fail(error)`; never throw for a business error.
- **Validate every external input** (request body, params, env vars) with a Zod schema.
- **RFC 9457** (Problem Details) for error responses.
- **Structured logging** via Pino (JSON, with a trace id and, where multi-tenant, a tenant id).
- **TypeScript strict**, zero `any` — use `unknown` plus a type guard.
- **Named exports** only; a barrel `index.ts` per feature.
- **JSDoc** on public service methods.
- **Pagination** on every `getAll()` (`.limit()` or cursor-based) — never return an unbounded list.
- **Comment the "why"** — a decision, a trade-off, a business rule, a workaround. Never the obvious.
- New feature ships with its test.

## Security

- Never log secrets, tokens, or personal data.
- Secrets live in the environment, never in the repo.
- Treat all incoming data as untrusted; validate at the boundary.
- Check authorization before returning data. In a multi-tenant service, every query filters by
  the tenant, in the data layer — a request with no tenant is blocked, never "sees everything".
- The error returned to the client carries no internal detail (path, version, stack).

## Zero tolerance for warnings and errors

Nothing ships with a lint error or warning, a type error, a failing test, or a broken build.
On finding one — even a pre-existing one — stop, fix it, confirm
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` is clean, then resume the task.
