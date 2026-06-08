/**
 * @lzr/commitlint-config
 * Configuração CommitLint da LZR Technologies
 * Baseada no Engineering Handbook: https://code.lzrtechnologies.com
 *
 * Formato: <type>: <description>
 * Exemplos:
 *   feat: adds dashboard feature
 *   fix: corrects timeout bug
 *   docs: updates README
 *   refactor: extracts validation logic
 *   test: adds auth flow tests
 *   chore: updates dependencies
 *   security: fixes SQL injection
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Tipos permitidos (Handbook)
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'refactor',
        'test',
        'chore',
        'security',
        'style',
        'perf',
        'ci',
        'build',
        'revert',
      ],
    ],
    // Tipo obrigatório e em minúsculas
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // Subject obrigatório
    'subject-empty': [2, 'never'],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],

    // Header máximo 100 caracteres
    'header-max-length': [2, 'always', 100],

    // Body com wrap em 100 caracteres
    'body-max-line-length': [1, 'always', 100],
  },
}
