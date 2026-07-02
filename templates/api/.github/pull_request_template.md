## What changes?

<!-- Describe what this PR does in 1-3 sentences -->

## Quality Checklist (Engineering Handbook)

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
- [ ] Tests for new logic (services, controllers, utils)

### Validation

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` with no new errors
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] Test coverage ≥ 80% on new features

### Security

- [ ] Never log passwords, tokens, national IDs, or card data
- [ ] Sensitive variables in `.env.local` (not in `.env`)
- [ ] Protected endpoints validate scope/auth

## References

- [Engineering Handbook](https://example.com/handbook)
