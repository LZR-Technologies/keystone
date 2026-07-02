# @repo/tsconfig

TypeScript configurations (shared).

## Installation

```bash
npm install -D github:your-org/tsconfig
```

## Usage

### Next.js project

```json
{
  "extends": "@repo/tsconfig/tsconfig.next.json",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Node/API project

```json
{
  "extends": "@repo/tsconfig/tsconfig.node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

### React Native / Expo project

```json
{
  "extends": "@repo/tsconfig/tsconfig.react-native.json"
}
```

## Available configs

| Config                       | Stack               | When to use                                            |
| ---------------------------- | ------------------- | ------------------------------------------------------ |
| `tsconfig.base.json`         | Shared base         | Do not use directly                                    |
| `tsconfig.node.json`         | Node.js APIs        | `extends: "@repo/tsconfig/tsconfig.node.json"`         |
| `tsconfig.next.json`         | Next.js App Router  | `extends: "@repo/tsconfig/tsconfig.next.json"`         |
| `tsconfig.react-native.json` | Expo / React Native | `extends: "@repo/tsconfig/tsconfig.react-native.json"` |

## History

Originally part of the `your-org/shared-config` monorepo. Split out in 2026 to resolve import resolution issues when installed via `github:` deps.

## Reference
