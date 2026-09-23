import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["apps/collab-web", "apps/opslens-web"];
const ignoredDirectories = new Set([".next", ".turbo", "dist", "node_modules"]);
const rawControlPattern = /<\s*(button|input|select|textarea)\b/g;
const rawLayoutPattern = /<\s*div\b[^>]*\bclassName="[^"]*\b(flex|grid)\b[^"]*"[^>]*>/g;
const violations = [];

function collectFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) collectFiles(join(directory, entry.name));
      continue;
    }
    if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) {
      inspectFile(join(directory, entry.name));
    }
  }
}

function inspectFile(filePath) {
  const source = readFileSync(filePath, "utf8");
  for (const match of source.matchAll(rawControlPattern)) {
    const line = source.slice(0, match.index).split("\n").length;
    violations.push({ filePath, line, tag: match[1] });
  }
  for (const match of source.matchAll(rawLayoutPattern)) {
    const line = source.slice(0, match.index).split("\n").length;
    violations.push({ filePath, line, tag: "div layout" });
  }
}

for (const root of roots) collectFiles(root);

if (violations.length > 0) {
  console.error(
    "Raw UI controls and layout containers are not allowed in web app screens. Use @repo/ui instead:"
  );
  for (const violation of violations) {
    console.error(`- ${relative(process.cwd(), violation.filePath)}:${violation.line} <${violation.tag}>`);
  }
  process.exitCode = 1;
} else {
  console.log(`UI usage check passed for ${roots.join(" and ")}.`);
}
