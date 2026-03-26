import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNextAppEslintConfig } from "@repo/eslint-config/next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default createNextAppEslintConfig(__dirname);
