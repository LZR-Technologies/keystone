# Service (API) template

A production-ready starting point for services (APIs) on **TypeScript/Node**.

## Stack

| Technology             | Role                                       |
| ---------------------- | ------------------------------------------ |
| **TypeScript**         | Language (strict mode, zero `any`)         |
| **Fastify**            | HTTP framework                             |
| **Zod**                | Schema validation                          |
| **Pino**               | Structured logging (JSON)                  |
| **Vitest**             | Unit and integration tests                 |
| **ESLint + Prettier**  | Linting and formatting (`@repo/*` configs) |
| **CommitLint + Husky** | Conventional commits                       |

## Quick start

### 1. Create a project from this template

Click **"Use this template"** on GitHub, or:

```bash
gh repo create my-project --template your-org/template-api --public --clone
cd my-project
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

### 4. Run in development

```bash
pnpm dev
# Server running on http://0.0.0.0:3000
```

### 5. Check

```bash
curl http://localhost:3000/api/v1/health
```

## Folder structure

```
src/
├── config/          # Configuration (env, logger)
│   ├── env.ts       # Env var validation (Zod)
│   └── logger.ts    # Structured logger (Pino)
├── modules/         # Domain modules, 3 layers each
│   └── health/      # Example: health check
│       ├── health.controller.ts   # HTTP shape only
│       ├── health.service.ts      # Business logic
│       ├── health.repository.ts   # Data access boundary
│       ├── health.routes.ts       # Route registration
│       ├── __tests__/             # Module tests
│       └── index.ts               # Barrel export
├── shared/          # Shared code
│   ├── middleware/  # Global middleware (error handler, auth, rate limit)
│   ├── types/       # Shared types (Result pattern, AppError, events)
│   └── constants/   # Named constants (HTTP status codes)
├── app.ts           # Builds the Fastify app (pure, testable via inject)
├── server.ts        # Starts listening + graceful shutdown
└── index.ts         # Entry point (starts the server)
db/
└── migrations/      # Ordered SQL migrations (see db/migrations/README.md)
scripts/             # db-migrate.sh, setup-branch-protection.sh
tests/               # Integration/e2e tests + testing doc
docs/                # deploy.md, ADRs
```

## Adding a new module

```bash
mkdir -p src/modules/companies
```

```
src/modules/companies/
├── companies.controller.ts   # HTTP shape only (request/reply mapping)
├── companies.service.ts      # Business logic (Result pattern)
├── companies.repository.ts   # Data access boundary (the only layer that sees the DB)
├── companies.routes.ts       # Route registration
├── __tests__/                # Module tests (ship with the module)
│   └── companies.service.test.ts
└── index.ts                  # Barrel export
```

Layer rule: controller -> service -> repository, never skipping, never
backwards. Register the module's routes in `src/app.ts`.

## Conventions

| Convention             | Where                                                 |
| ---------------------- | ----------------------------------------------------- |
| **Zero `any`**         | tsconfig strict + ESLint rule                         |
| **Result pattern**     | `ok(data)` / `fail(error)` in `shared/types`          |
| **RFC 9457**           | Error handler returns Problem Details                 |
| **Zod validation**     | Every external input validated                        |
| **Structured logging** | Pino JSON with a trace id                             |
| **3-layer modules**    | controller / service / repository per domain          |
| **Barrel exports**     | `index.ts` in each module                             |
| **snake_case in SQL**  | All DB identifiers; camelCase stays in TS             |
| **Tests always grow**  | Every feature ships with its test (`tests/README.md`) |

## Scripts

| Script               | What it does                                   |
| -------------------- | ---------------------------------------------- |
| `pnpm dev`           | Dev server with hot reload                     |
| `pnpm build`         | Compile TypeScript                             |
| `pnpm start`         | Run the build in production                    |
| `pnpm typecheck`     | Type check                                     |
| `pnpm lint`          | Run ESLint                                     |
| `pnpm test`          | Run tests                                      |
| `pnpm test:coverage` | Tests with coverage (100% threshold, enforced) |
| `pnpm db:migrate`    | Apply SQL migrations (needs `DATABASE_URL`)    |

## Database

SQL migrations live in `db/migrations/` (naming, ordering, and conventions in
[db/migrations/README.md](db/migrations/README.md)). They are applied in order
by `scripts/db-migrate.sh`, tracked in a `schema_migrations` table, and always
run BEFORE the code deploys.

## Deploy

Two GitHub Actions pipelines ship the service: `develop` -> staging and
`main` -> production, each running quality gates, then migrations, then the
deploy, then a smoke test. Hosting is your choice — one marked step per
workflow is all you fill in. Full guide: [docs/deploy.md](docs/deploy.md).

## Working with the agent

This project ships with a harness for an AI coding agent (see
[CLAUDE.md](CLAUDE.md)). Two commands drive a session's hand-off: say
**"resume session"** to pick up where the last session left off, and
**"close session"** to write a hand-off briefing before you stop. Full
details: [docs/agent-harness.md](docs/agent-harness.md).

## Reference

- [Fastify](https://fastify.dev/)
- [Zod](https://zod.dev/)
