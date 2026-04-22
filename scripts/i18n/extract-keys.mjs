#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { ROOT, APPS_DIR, getByPath, listMessageGroups, readJson, setByPath, writeJson } from "./lib/message-groups.mjs";

const CHECK_ONLY = process.argv.includes("--check");
const SOURCE_GLOBS = ["app", "features", "lib", "components"];
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts"]);

function walkFiles(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue;
      walkFiles(path.join(dir, entry.name), out);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!CODE_EXTENSIONS.has(ext)) continue;
    out.push(path.join(dir, entry.name));
  }
}

function getNamespaces(content) {
  const map = new Map();
  const regex = /const\s+([A-Za-z_$][\w$]*)\s*=\s*useTranslations\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    map.set(match[1], match[2]);
  }
  return map;
}

function extractFromContent(content) {
  const keys = new Set();
  const namespaces = getNamespaces(content);

  const callRegex = /([A-Za-z_$][\w$]*)(?:\.(?:rich|markup|raw))?\(\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = callRegex.exec(content)) !== null) {
    const fnName = match[1];
    const key = match[2].trim();
    if (!key) continue;

    if (namespaces.has(fnName)) {
      const ns = namespaces.get(fnName);
      const fullKey = `${ns}.${key}`;
      keys.add(fullKey);
      continue;
    }

    if (fnName === "t" && key.includes(".")) {
      keys.add(key);
    }
  }

  return keys;
}

function collectAppKeys(appName) {
  const appRoot = path.join(APPS_DIR, appName);
  const files = [];
  for (const scope of SOURCE_GLOBS) {
    walkFiles(path.join(appRoot, scope), files);
  }

  const keys = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const fileKeys = extractFromContent(content);
    for (const key of fileKeys) {
      keys.add(key);
    }
  }

  return [...keys].sort();
}

function main() {
  const groups = listMessageGroups();

  if (groups.length === 0) {
    console.log("[i18n-extract] No message groups found.");
    return;
  }

  const wouldAdd = [];
  let addedCount = 0;

  for (const group of groups) {
    const extractedKeys = collectAppKeys(group.appName);
    if (extractedKeys.length === 0) continue;

    const baseJson = readJson(group.baseFile);
    let mutated = false;

    for (const key of extractedKeys) {
      if (getByPath(baseJson, key) !== undefined) continue;
      if (CHECK_ONLY) {
        wouldAdd.push(`${group.appName}:${key}`);
      } else {
        setByPath(baseJson, key, `__TODO_TRANSLATE__:${key}`);
        mutated = true;
        addedCount += 1;
      }
    }

    if (!CHECK_ONLY && mutated) {
      writeJson(group.baseFile, baseJson);
      console.log(`[i18n-extract] updated ${path.relative(ROOT, group.baseFile)}`);
    }
  }

  if (CHECK_ONLY) {
    if (wouldAdd.length === 0) {
      console.log("[i18n-extract] check OK (no new keys).\n");
      return;
    }

    console.error("[i18n-extract] check failed. New keys found in code but missing in base locale:");
    for (const entry of wouldAdd) {
      console.error(`  - ${entry}`);
    }
    process.exit(1);
  }

  if (addedCount === 0) {
    console.log("[i18n-extract] No new keys found.");
    return;
  }

  console.log(`[i18n-extract] Completed. Added ${addedCount} key(s).`);
}

main();
