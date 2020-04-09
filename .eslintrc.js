module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'prettier',
    'progress',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/class-name-casing': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'import/no-unresolved': 'off',
    'prettier/prettier': ['error'],
    'progress/activate': 'warn',
    'import/newline-after-import': [
      'error',
      {
        count: 1,
      },
    ],
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
        },
        groups: ['builtin', 'external', 'internal', ['parent', 'index', 'sibling']],
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
          },
          {
            pattern: '$/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '%/**',
            group: 'internal',
            position: 'after',
          },
        ],
      },
    ],
  },
};
