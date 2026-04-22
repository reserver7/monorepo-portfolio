#!/usr/bin/env node

import path from "node:path";
import { ROOT, flattenKeys, listMessageGroups, readJson } from "./lib/message-groups.mjs";

function compareGroup(group) {
  const referenceKeys = new Set(flattenKeys(readJson(group.baseFile)));
  const errors = [];

  for (const file of group.files) {
    const currentKeys = new Set(flattenKeys(readJson(file)));
    const missing = [...referenceKeys].filter((key) => !currentKeys.has(key));
    const extra = [...currentKeys].filter((key) => !referenceKeys.has(key));
    if (missing.length === 0 && extra.length === 0) {
      continue;
    }

    errors.push({ file, missing, extra });
  }

  return { group, errors };
}

function main() {
  const groups = listMessageGroups();

  if (groups.length === 0) {
    console.log("[i18n-check] No message groups found under apps/*/lib/i18n/messages.");
    process.exit(0);
  }

  const results = groups.map(compareGroup);
  const failed = results.filter((result) => result.errors.length > 0);

  if (failed.length === 0) {
    console.log(`[i18n-check] OK (${groups.length} app group${groups.length > 1 ? "s" : ""})`);
    process.exit(0);
  }

  for (const result of failed) {
    console.error(`\n[i18n-check] app=${result.group.appName}`);
    console.error(`  reference=${path.relative(ROOT, result.group.baseFile)}`);
    for (const err of result.errors) {
      console.error(`  file=${path.relative(ROOT, err.file)}`);
      if (err.missing.length > 0) {
        console.error(`    missing(${err.missing.length}): ${err.missing.join(", ")}`);
      }
      if (err.extra.length > 0) {
        console.error(`    extra(${err.extra.length}): ${err.extra.join(", ")}`);
      }
    }
  }

  process.exit(1);
}

main();
