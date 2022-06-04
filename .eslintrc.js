module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint-config-standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    semi: ['error', 'always']
  }
};
