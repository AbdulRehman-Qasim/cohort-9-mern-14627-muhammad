const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = [
  { ignores: ['coverage/**'] },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
    },
  },
  eslintPluginPrettierRecommended,
];
