module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'google'],
  rules: {
    quotes: ['error', 'single'],
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        ignoredNodes: ['ConditionalExpression'],
      },
    ],
  },
  parserOptions: {
    // Required for certain syntax usages
    ecmaVersion: 2020,
  },
};
