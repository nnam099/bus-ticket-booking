const js = require('@eslint/js');

module.exports = [
  {
    ignores: ['coverage/**', 'node_modules/**', 'logs/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'prisma/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        Buffer: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
