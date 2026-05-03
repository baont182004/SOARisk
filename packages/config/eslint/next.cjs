module.exports = {
  extends: [require.resolve('./base.cjs'), 'next/core-web-vitals'],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': 'off',
  },
};
