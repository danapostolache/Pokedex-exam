// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*"],
  },
  // The test scripts run in Node, not in the app.
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: { Buffer: "readonly" } },
    rules: { "import/no-unresolved": ["error", { ignore: ["^node:"] }] },
  },
]);
