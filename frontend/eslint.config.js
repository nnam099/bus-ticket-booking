const browserGlobals = {
  alert: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  window: 'readonly',
};

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: browserGlobals,
    },
    rules: {
      // Without eslint-plugin-react, core no-unused-vars reports JSX components as unused.
      'no-unused-vars': 'off',
      'no-undef': 'error',
    },
  },
];
