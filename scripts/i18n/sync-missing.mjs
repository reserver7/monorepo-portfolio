#!/usr/bin/env node

import path from "node:path";
import { ROOT, listMessageGroups, readJson, sortObject, writeJson } from "./lib/message-groups.mjs";

const CHECK_ONLY = process.argv.includes("--check");
const TODO_PREFIX = "__TODO_TRANSLATE__:";

function mergeMissing(base, target) {
  if (Array.isArray(base) || base === null || typeof base !== "object") {
    if (target === undefined) {
      return base;
    }
    if (typeof target === "string" && target.startsWith(TODO_PREFIX)) {
      return base;
    }
    return target;
  }

  const result = target && typeof target === "object" && !Array.isArray(target) ? { ...target } : {};
  for (const [key, baseValue] of Object.entries(base)) {
    if (!(key in result)) {
      result[key] = baseValue;
      continue;
    }
    result[key] = mergeMissing(baseValue, result[key]);
  }
  return result;
}

function main() {
  const groups = listMessageGroups();

  if (groups.length === 0) {
    console.log("[i18n-sync] No message groups found.");
    return;
  }

  let touched = 0;
  const wouldUpdate = [];

  for (const group of groups) {
    const base = readJson(group.baseFile);

    for (const file of group.files) {
      if (file === group.baseFile) continue;
      const current = readJson(file);
      const next = mergeMissing(base, current);
      const before = JSON.stringify(sortObject(current));
      const after = JSON.stringify(sortObject(next));
      if (before !== after) {
        if (CHECK_ONLY) {
          wouldUpdate.push(path.relative(ROOT, file));
        } else {
          writeJson(file, next);
          touched += 1;
          console.log(`[i18n-sync] updated ${path.relative(ROOT, file)}`);
        }
      }
    }
  }

  if (CHECK_ONLY) {
    if (wouldUpdate.length === 0) {
      console.log("[i18n-sync] check OK (no missing keys).");
      return;
    }

    console.error("[i18n-sync] check failed. Missing keys detected in:");
    for (const file of wouldUpdate) {
      console.error(`  - ${file}`);
    }
    process.exit(1);
  }

  if (touched === 0) {
    console.log("[i18n-sync] No missing keys found.");
    return;
  }

  console.log(`[i18n-sync] Completed. Updated ${touched} file(s).`);
}

main();
