## Closes

<!-- REQUIRED. Every PR closes exactly one issue: one branch = one issue = one PR.
     If there is no issue yet, open one first - the issue defines what "done" means. -->

Closes #

## What changes?

<!-- Describe what this PR does in 1-3 sentences -->

## Quality Checklist

### Code

- [ ] JSDoc on all new/modified public methods
- [ ] Explanatory comments on non-obvious decisions (trade-offs, workarounds, business rules)
- [ ] Result Pattern (`ok` / `fail`) instead of throw for business errors
- [ ] Zod validating all external input (body, params, headers, env vars)
- [ ] Structured logging via Pino (no `console.*`)
- [ ] Zero `any` — use `unknown` + type guard
- [ ] Named exports (no `default`)
- [ ] Pagination on listing queries (`.limit()` or cursor)
- [ ] HTTP errors following RFC 9457 (Problem Details)
- [ ] Tests for new logic (services, controllers, utils) — every feature ships with its test

### Database (if this PR touches the schema)

- [ ] Change is a NEW migration file (`db/migrations/NNNN_*.sql`) — applied files are never edited
- [ ] All identifiers snake_case; new tables carry id/tenant_id/created_at/updated_at/deleted_at + RLS

### Validation

- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run lint` with no new errors
- [ ] `pnpm run test` passes
- [ ] `pnpm run build` passes
- [ ] Test coverage = 100% (enforced by `pnpm run test:coverage`; see vitest.config.ts for the two honest bootstrap-file exclusions)

### Security

- [ ] Never log passwords, tokens, national IDs, or card data
- [ ] Sensitive variables in `.env.local` (not in `.env`)
- [ ] Protected endpoints validate scope/auth
