import { node } from '@lzr/eslint-config'

export default [
  ...node,
  {
    // Why: vitest.config.ts vive na raiz e não está no `tsconfig.include: ["src"]`,
    // então o type-aware lint do @typescript-eslint não consegue parsear. Ignorar
    // explicitamente evita erro de parse sem afetar o lint do código de produto.
    ignores: ['dist/', 'node_modules/', 'coverage/', 'vitest.config.ts'],
  },
]
