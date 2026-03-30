import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

const BASE_FILE_GLOBS = ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"];

const WORKSPACE_IGNORES = [
  "**/node_modules/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/dist/**",
  "**/coverage/**",
  "**/*.d.ts",
  "apps/server/data/state.json",
  "pnpm-lock.yaml"
];

export const createWorkspaceEslintConfig = () => [
  {
    ignores: WORKSPACE_IGNORES
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: BASE_FILE_GLOBS,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      "no-console": "off"
    }
  },
  {
    files: ["apps/server/**/*.{js,ts}", "packages/**/*.{js,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  prettierConfig
];
