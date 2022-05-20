module.exports = {
  root: true,
  env: {
    browser: true,
    amd: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['eslint:recommended', "plugin:@typescript-eslint/recommended"],
  rules: {
    // TODO: currently set to match the existing code, though i recommend revisiting
    'prefer-const': 'off',
    '@typescript-eslint/no-var-requires': 'warn',
    '@typescript-eslint/no-empty-function': 'warn'
  }
};
