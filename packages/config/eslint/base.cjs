module.exports = {
  root: false,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
  },
  env: {
    es2022: true,
    node: true,
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  ignorePatterns: ['dist', '.next', 'node_modules'],
  rules: {
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
  },
};
