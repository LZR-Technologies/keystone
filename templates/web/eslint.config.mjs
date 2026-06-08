import { react } from '@lzr/eslint-config'

export default [
  ...react,
  {
    ignores: ['.next/', 'node_modules/', 'coverage/', 'out/'],
  },
]
