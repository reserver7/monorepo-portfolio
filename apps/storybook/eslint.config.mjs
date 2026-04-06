import { createWorkspaceEslintConfig } from "@repo/eslint-config/base";

const config = createWorkspaceEslintConfig();

export default [{ ignores: ["storybook-static/**"] }, ...config];
