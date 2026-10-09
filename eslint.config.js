// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  {
    ignores: [
      "dist/**",
      "**/__tests__/**",
      "**/*.test.*",
      "jest.setup.js",
      "mcp-server/**",
      "print-bridge/**",
      "public/**",
      "scripts/**",
      "functions/**"
    ],
  },
  expoConfig,
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
  }
]);
