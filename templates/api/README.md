# Service (API) template

An official starting point for services (APIs) on **TypeScript/Node**.

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
├── features/        # Features organized by domain
│   └── health/      # Example: health check
│       ├── health.controller.ts
│       └── index.ts
├── shared/          # Shared code
│   ├── middleware/  # Global middleware
│   │   └── error-handler.ts  # RFC 9457
│   ├── types/       # Shared types
│   │   ├── error.ts   # AppError + Problem Details
│   │   ├── result.ts  # Result pattern
│   │   └── index.ts
│   └── utils/       # Utilities
└── index.ts         # Entry point (bootstrap)
```

## Adding a new feature

```bash
mkdir -p src/features/companies
```

```
src/features/companies/
├── companies.controller.ts   # Routes
├── companies.service.ts      # Business logic
├── companies.types.ts        # Types and Zod schemas
├── companies.validation.ts   # Input validation
├── __tests__/                # Feature tests
│   └── companies.test.ts
└── index.ts                  # Barrel export
```

## Conventions

| Convention             | Where                                        |
| ---------------------- | -------------------------------------------- |
| **Zero `any`**         | tsconfig strict + ESLint rule                |
| **Result pattern**     | `ok(data)` / `fail(error)` in `shared/types` |
| **RFC 9457**           | Error handler returns Problem Details        |
| **Zod validation**     | Every external input validated               |
| **Structured logging** | Pino JSON with a trace id                    |
| **Feature-based**      | Code organized by domain                     |
| **Barrel exports**     | `index.ts` in each feature                   |

## Scripts

| Script               | What it does                |
| -------------------- | --------------------------- |
| `pnpm dev`           | Dev server with hot reload  |
| `pnpm build`         | Compile TypeScript          |
| `pnpm start`         | Run the build in production |
| `pnpm typecheck`     | Type check                  |
| `pnpm lint`          | Run ESLint                  |
| `pnpm test`          | Run tests                   |
| `pnpm test:coverage` | Tests with coverage (>80%)  |

## Reference

- [Fastify](https://fastify.dev/)
- [Zod](https://zod.dev/)
