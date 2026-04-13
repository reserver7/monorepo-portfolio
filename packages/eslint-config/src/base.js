import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

const DEFAULT_IGNORES = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/next-env.d.ts",
  "**/coverage/**",
  "**/.turbo/**",
  "**/*.min.js"
];

export const createWorkspaceEslintConfig = () => {
  return createWorkspaceEslintConfigWithOptions();
};

export const createWorkspaceEslintConfigWithOptions = (options = {}) => {
  const noExplicitAnyRule = options.noExplicitAny ?? "off";
  const additionalIgnores = options.additionalIgnores ?? [];

  return [
    { ignores: [...DEFAULT_IGNORES, ...additionalIgnores] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ["**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}"],
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.node,
          ...globals.es2024
        }
      }
    },
    {
      files: ["**/*.{ts,tsx,mts,cts}"],
      rules: {
        "@typescript-eslint/no-explicit-any": noExplicitAnyRule
      }
    },
    prettier
  ];
};

export default createWorkspaceEslintConfig;
