# Contributing to Keystone

Keystone is **open**: anyone can read it, use it, and propose improvements — with the maintainer in
control. Nothing lands unreviewed, and the automated guards filter most issues before a human looks.

## How a contribution flows

1. Work on a **separate branch** — never on the protected one.
2. Run the checks **locally** before proposing:
   - `node --test tests/*.test.ts` — every test must pass.
   - `node src/index.ts check .` — the guards and the project's own gates (format, lint, types,
     dependency audit) must be clean.
3. Open a **pull request**. The same checks run again on the way in.
4. A **maintainer reviews** and has the final say: approve, request changes, or decline.

## Principles the code follows

- **Runs on its own, zero AI cost.** Anything deterministic stays deterministic.
- **Resolve problems at the root** — never silence a check with a reactive exception.
- **Tests ship with each feature** and cover the failures, not only the happy path.
- **Comments explain the "why"**, not the obvious.
- **Secrets never live in the code.**

The full design — the 8 pillars, the core rationale, the end-to-end flow — is in [docs/](docs/).

Every change is attributed to its author.
