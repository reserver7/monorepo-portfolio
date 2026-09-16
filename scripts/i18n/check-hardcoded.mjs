#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { APPS_DIR, ROOT } from "./lib/message-groups.mjs";

const SOURCE_DIRS = ["app", "components", "features", "lib"];
const SHARED_SOURCE_DIRS = [
  path.join(ROOT, "packages", "ui", "components"),
  path.join(ROOT, "packages", "ui", "layouts"),
  path.join(ROOT, "packages", "theme", "src"),
  path.join(ROOT, "packages", "forms", "src"),
  path.join(ROOT, "templates", "next-app", "app")
];
const USER_FACING_ATTRIBUTE =
  /\b(?:label|title|description|placeholder|aria-label|confirmText|cancelText|message|fallbackTitle|fallbackDescription)\s*=\s*(?:"([^"]*[가-힣][^"]*)"|'([^']*[가-힣][^']*)')/g;
const USER_FACING_CALL =
  /\b(?:toast\.(?:success|error|info|warning)|setError)\([^()\n]*?(?:"([^"]*[가-힣][^"]*)"|'([^']*[가-힣][^']*)')/g;
const JSX_TEXT = />\s*([^<{\n]*[가-힣][^<{\n]*)\s*</g;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".next") continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(file);
  }
  return files;
}

function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function collectFindings(file) {
  const content = fs.readFileSync(file, "utf8");
  const findings = [];
  for (const pattern of [USER_FACING_ATTRIBUTE, USER_FACING_CALL, JSX_TEXT]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content))) {
      const value = match.slice(1).find(Boolean)?.trim();
      if (value) findings.push({ line: lineNumber(content, match.index), value });
    }
  }
  return findings;
}

const findings = [];
for (const appName of fs.existsSync(APPS_DIR) ? fs.readdirSync(APPS_DIR) : []) {
  const appRoot = path.join(APPS_DIR, appName);
  if (!fs.statSync(appRoot).isDirectory()) continue;
  for (const sourceDir of SOURCE_DIRS) {
    for (const file of walk(path.join(appRoot, sourceDir))) {
      for (const finding of collectFindings(file)) findings.push({ file, ...finding });
    }
  }
}
for (const sourceDir of SHARED_SOURCE_DIRS) {
  for (const file of walk(sourceDir)) {
    for (const finding of collectFindings(file)) findings.push({ file, ...finding });
  }
}

if (findings.length > 0) {
  console.error(`[i18n-hardcoded] found ${findings.length} user-facing literal(s):`);
  for (const finding of findings) {
    console.error(`  - ${path.relative(ROOT, finding.file)}:${finding.line}: ${finding.value}`);
  }
  process.exit(1);
}

console.log("[i18n-hardcoded] OK");
