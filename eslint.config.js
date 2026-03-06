import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "node_modules"]
  },
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser
    }
  },
  {
    files: ["**/*.test.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
        describe: "readonly",
        it: "readonly",
        expect: "readonly"
      }
    }
  },
  {
    files: ["**/*.vue"],
    extends: [...pluginVue.configs["flat/recommended"]],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2022,
        sourceType: "module",
        extraFileExtensions: [".vue"]
      },
      globals: globals.browser
    },
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off"
    }
  },
  {
    files: ["vite.config.ts", "eslint.config.js"],
    languageOptions: {
      globals: globals.node
    }
  }
);
