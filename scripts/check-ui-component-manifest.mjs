#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { loadUiComponentManifest } from "./lib/ui-component-manifest.mjs";
import { parseExportedNames } from "./lib/ui-storybook-targets.mjs";

const root = process.cwd();
const indexPath = path.join(root, "packages/ui/components/index.ts");
const manifest = loadUiComponentManifest(root);
const publicExports = new Set(parseExportedNames(fs.readFileSync(indexPath, "utf8")));
const names = manifest.map((entry) => entry.name);
const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
const missing = [...publicExports].filter((name) => !names.includes(name));
const stale = names.filter((name) => !publicExports.has(name));
const invalid = manifest.filter((entry) => !entry.name || !entry.category || !/^[A-Z]/.test(entry.name));

if (duplicates.length || missing.length || stale.length || invalid.length) {
  if (duplicates.length) console.error(`duplicate manifest entries: ${[...new Set(duplicates)].join(", ")}`);
  if (missing.length) console.error(`missing public exports: ${missing.join(", ")}`);
  if (stale.length) console.error(`stale manifest entries: ${stale.join(", ")}`);
  if (invalid.length) console.error(`invalid manifest entries: ${invalid.map((entry) => entry.name ?? "<unnamed>").join(", ")}`);
  process.exit(1);
}

console.log(`UI component manifest valid: ${manifest.length} entries`);
