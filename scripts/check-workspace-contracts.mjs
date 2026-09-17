#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { flattenKeys, listMessageGroups, readJson } from "./i18n/lib/message-groups.mjs";

const root = process.cwd();
const roots = ["apps", "packages", "templates"];
const errors = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "storybook-static"].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    entry.isDirectory() ? files.push(...walk(file)) : files.push(file);
  }
  return files;
}

function collectPublicEnvKeys(directory) {
  const keys = new Set();
  for (const file of walk(directory).filter((file) => /\.(?:ts|tsx|js|mjs|cjs)$/.test(file))) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/process\.env\.(NEXT_PUBLIC_[A-Z0-9_]+)/g)) keys.add(match[1]);
  }
  return keys;
}

function collectExampleEnvKeys(directory) {
  const keys = new Set();
  for (const file of walk(directory).filter(
    (file) => path.basename(file).includes(".env") && file.endsWith(".example")
  )) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([A-Z][A-Z0-9_]*)=/);
      if (match) keys.add(match[1]);
    }
  }
  return keys;
}

for (const directory of roots) {
  for (const file of walk(path.join(root, directory)).filter((file) => file.endsWith(".json"))) {
    try {
      readJson(file);
    } catch (error) {
      errors.push(`${path.relative(root, file)}: invalid JSON (${error.message})`);
    }
  }
}

for (const app of fs
  .readdirSync(path.join(root, "apps"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())) {
  const appDir = path.join(root, "apps", app.name);
  const used = collectPublicEnvKeys(appDir);
  const examples = collectExampleEnvKeys(appDir);
  for (const key of used) {
    if (!examples.has(key))
      errors.push(`${path.relative(root, appDir)}: missing public environment example (${key})`);
  }
}

const packageNames = new Map();
for (const directory of roots) {
  for (const file of walk(path.join(root, directory)).filter(
    (file) => path.basename(file) === "package.json"
  )) {
    const packageDir = path.dirname(file);
    const manifest = readJson(file);
    if (manifest.name && packageNames.has(manifest.name)) {
      errors.push(`duplicate package name ${manifest.name}`);
    }
    if (manifest.name) packageNames.set(manifest.name, file);
    for (const field of ["main", "types"]) {
      if (typeof manifest[field] === "string" && !fs.existsSync(path.resolve(packageDir, manifest[field]))) {
        errors.push(`${path.relative(root, file)}: ${field} target does not exist (${manifest[field]})`);
      }
    }
    for (const target of Object.values(manifest.exports ?? {})) {
      if (typeof target !== "string" || target.includes("*")) continue;
      if (!fs.existsSync(path.resolve(packageDir, target))) {
        errors.push(`${path.relative(root, file)}: export target does not exist (${target})`);
      }
    }
  }
}

for (const group of listMessageGroups()) {
  const reference = new Set(flattenKeys(readJson(group.baseFile)));
  for (const file of group.files) {
    const current = new Set(flattenKeys(readJson(file)));
    const missing = [...reference].filter((key) => !current.has(key));
    const extra = [...current].filter((key) => !reference.has(key));
    if (missing.length || extra.length) errors.push(`${path.relative(root, file)}: i18n key mismatch`);
  }
}

for (const command of ["i18n:check", "i18n:extract:check", "ui:manifest:check", "ui:foundations:check"]) {
  const result = spawnSync("pnpm", [command], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) errors.push(`${command} failed`);
}

if (errors.length) {
  console.error("[workspace-contracts] failed");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`[workspace-contracts] OK (${packageNames.size} packages, JSON/export/i18n contracts)`);
