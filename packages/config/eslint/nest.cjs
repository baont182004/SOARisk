module.exports = {
  extends: [require.resolve('./base.cjs')],
  env: {
    node: true,
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': 'off',
  },
};
