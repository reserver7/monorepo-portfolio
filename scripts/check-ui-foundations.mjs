import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const css = fs.readFileSync(path.join(root, "packages/ui/styles/design-system.css"), "utf8");
const required = [
  "--color-bg-canvas",
  "--color-bg-surface",
  "--color-fg-default",
  "--color-fg-muted",
  "--color-accent-primary",
  "--color-feedback-success",
  "--color-feedback-warning",
  "--color-feedback-danger",
  "--color-feedback-info",
  "--focus-ring-shadow",
  "--duration-fast"
];
const missing = required.filter((token) => !css.includes(`${token}:`));
if (missing.length) throw new Error(`missing foundation tokens: ${missing.join(", ")}`);
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css))
  throw new Error("missing prefers-reduced-motion fallback");
if (!/color-scheme:\s*dark/.test(css)) throw new Error("missing dark color-scheme");
console.log(`UI foundations valid: ${required.length} semantic tokens, dark mode, reduced motion`);
