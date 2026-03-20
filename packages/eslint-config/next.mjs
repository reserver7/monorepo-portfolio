import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import { createWorkspaceEslintConfig } from "./base.mjs";

const NEXT_APP_FILE_GLOBS = ["**/*.{js,mjs,cjs,jsx,ts,tsx}"];

export const createNextAppEslintConfig = (rootDir) => [
  ...createWorkspaceEslintConfig(),
  {
    files: NEXT_APP_FILE_GLOBS,
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooks
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
      "@next/next/no-html-link-for-pages": "off"
    },
    settings: {
      next: {
        rootDir
      }
    }
  }
];
