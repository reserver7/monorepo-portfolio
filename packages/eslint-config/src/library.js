import { createWorkspaceEslintConfigWithOptions } from "./base.js";

export const createLibraryEslintConfig = (options = {}) =>
  createWorkspaceEslintConfigWithOptions({
    noExplicitAny: options.noExplicitAny ?? "off",
    additionalIgnores: options.additionalIgnores ?? []
  });

export default createLibraryEslintConfig;
