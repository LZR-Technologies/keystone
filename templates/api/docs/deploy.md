# Deploy pipeline

Two environments, two workflows, one contract: **quality gates, then
migrations, then code, then a smoke test** — in that order, always.

| Environment    | Branch    | Workflow                                  |
| -------------- | --------- | ----------------------------------------- |
| **staging**    | `develop` | `.github/workflows/deploy-staging.yml`    |
| **production** | `main`    | `.github/workflows/deploy-production.yml` |

`develop` is the integration branch: every merge lands on staging
automatically. `main` is the protected branch: it only moves through reviewed,
CI-green pull requests (see `scripts/setup-branch-protection.sh`), and every
merge deploys production.

## Pipeline stages

```
gates ──> migrate ──> deploy ──> smoke
```

1. **gates** — reuses the CI workflow (typecheck, lint, tests with coverage,
   build). The bar for reaching an environment is exactly the bar for merging
   a PR; sharing the workflow means the two can never drift apart.
2. **migrate** — runs `scripts/db-migrate.sh` against the environment's
   database. **Migrations always ship before the code** so new code never
   meets an old schema. The runner is idempotent (tracked in
   `schema_migrations`), so re-runs are safe. See `db/migrations/README.md`.
3. **deploy** — pushes the new code to your host. This job contains **the one
   step you fill in** (see below).
4. **smoke** — probes `HEALTH_URL` until it answers HTTP 200 (with retries for
   rolling restarts) and fails the run otherwise. A deploy is not done because
   the host accepted it; it is done when the service answers.

## Per-environment configuration

Create two GitHub Environments (repo Settings > Environments): `staging` and
`production`. On each, set:

| Kind         | Name           | Value                                                                |
| ------------ | -------------- | -------------------------------------------------------------------- |
| **Secret**   | `DATABASE_URL` | Postgres connection string for THAT environment                      |
| **Variable** | `HEALTH_URL`   | Public health endpoint, e.g. `https://api.example.com/api/v1/health` |
| **Secret**   | host token     | Whatever your deploy command needs (see examples below)              |

Binding the jobs to GitHub Environments is what keeps credentials separated:
the staging workflow physically cannot read production secrets. On the
`production` environment, consider adding **required reviewers** — that turns
the production deploy into an approve-to-ship gate with zero pipeline changes.

## The one line you fill in

Hosting is the developer's choice by design — the template does not pick a
vendor. Each deploy workflow has a single step marked `FILL THIS ONE STEP`;
replace its `run` block with your host's deploy command:

```yaml
# Fly.io
- name: Deploy to host
  run: flyctl deploy --remote-only
  env:
    FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

# Render (deploy hook)
- name: Deploy to host
  run: curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"
  env:
    RENDER_DEPLOY_HOOK_URL: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}

# Plain VPS over SSH
- name: Deploy to host
  run: ssh deploy@my-host 'cd /srv/api && git pull && docker compose up -d --build'
```

Until you fill it in, the deploy step **fails loudly on purpose**. A pipeline
that goes green while deploying nothing would be lying about the one thing it
exists to guarantee.

## Rollback

- **Code**: revert the offending PR on `main` (or `develop`); the pipeline
  redeploys the previous state through the same gates.
- **Database**: migrations are forward-only. To undo schema, write a new
  migration that reverses it — never edit or delete an applied file
  (`db/migrations/README.md` has the full rules).
