#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { flattenKeys, listMessageGroups, readJson } from "./i18n/lib/message-groups.mjs";

const root = process.cwd();
const roots = ["apps", "packages", "templates"];
const errors = [];

const sharedDependencyPolicy = {
  typescript: "^5.8.2",
  "@types/node": "^22.13.5",
  zod: "^3.25.76",
  tailwindcss: "^3.4.17",
  autoprefixer: "^10.4.21",
  postcss: "^8.5.3",
  tsx: "^4.20.6",
  "socket.io-client": "^4.8.3"
};

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

for (const directory of roots) {
  for (const file of walk(path.join(root, directory)).filter((file) => file.endsWith(".json"))) {
    try {
      readJson(file);
    } catch (error) {
      errors.push(`${path.relative(root, file)}: invalid JSON (${error.message})`);
    }
  }
}

const packageNames = new Map();
const dependencySpecifiers = new Map(Object.keys(sharedDependencyPolicy).map((name) => [name, new Map()]));
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
    for (const [name, expected] of Object.entries(sharedDependencyPolicy)) {
      const specifier = manifest.dependencies?.[name] ?? manifest.devDependencies?.[name];
      if (specifier) dependencySpecifiers.get(name).set(file, { expected, specifier });
    }
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

for (const [name, entries] of dependencySpecifiers) {
  for (const [file, { expected, specifier }] of entries) {
    if (specifier !== expected) {
      errors.push(`${path.relative(root, file)}: ${name} must use ${expected} (found ${specifier})`);
    }
  }
}

const trackedGenerated = spawnSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
  .stdout.split("\0")
  .filter(Boolean)
  .filter((file) =>
    /(^|\/)(dist|\.next|storybook-static|coverage|playwright-report|test-results|node_modules)(\/|$)/.test(
      file
    )
  );
for (const file of trackedGenerated) errors.push(`generated output must not be tracked (${file})`);

const envExampleFiles = [
  path.join(root, ".env.example"),
  path.join(root, ".env.infrastructure.example"),
  ...roots.flatMap((directory) => walk(path.join(root, directory)))
].filter((file) => /(^|\/)\.env[^/]*\.example$/.test(file));
for (const file of envExampleFiles) {
  const keys = new Set();
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/);
    if (!match) continue;
    if (keys.has(match[1]))
      errors.push(`${path.relative(root, file)}: duplicate environment key ${match[1]}`);
    keys.add(match[1]);
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
