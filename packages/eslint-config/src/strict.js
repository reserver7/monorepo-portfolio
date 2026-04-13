import { createWorkspaceEslintConfigWithOptions } from "./base.js";

export const createStrictWorkspaceEslintConfig = () =>
  createWorkspaceEslintConfigWithOptions({
    noExplicitAny: "warn"
  });

export default createStrictWorkspaceEslintConfig;
