#!/usr/bin/env node

import process from "node:process";
import { flattenKeys, getByPath, listMessageGroups, readJson, setByPath, writeJson } from "./lib/message-groups.mjs";

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check");
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");

const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
const targetsArg = process.argv.find((arg) => arg.startsWith("--targets="));
const providerArg = process.argv.find((arg) => arg.startsWith("--provider="));
const modelArg = process.argv.find((arg) => arg.startsWith("--model="));

const SOURCE_LOCALE = sourceArg ? sourceArg.split("=")[1] : "ko";
const TARGET_LOCALES = (targetsArg ? targetsArg.split("=")[1] : "en,ja")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);
const PROVIDER = providerArg ? providerArg.split("=")[1] : "openai";
const MODEL = modelArg ? modelArg.split("=")[1] : "gpt-4o-mini";
const TODO_PREFIX = "__TODO_TRANSLATE__:";

function shouldTranslate(value) {
  if (value === undefined || value === null) return true;
  if (typeof value !== "string") return false;
  if (value.trim().length === 0) return true;
  if (value.startsWith(TODO_PREFIX)) return true;
  return FORCE;
}

async function translateWithOpenAI(input, targetLocale) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return `${TODO_PREFIX}${targetLocale}:${input}`;
  }

  const prompt = [
    "You are translating UI copy for a SaaS dashboard.",
    `Source locale: ${SOURCE_LOCALE}`,
    `Target locale: ${targetLocale}`,
    "Rules:",
    "- Return plain translated text only.",
    "- Keep variables/placeholders/tokens unchanged (e.g. {count}, %s, {{name}}).",
    "- Keep concise UI tone.",
    `Text: ${input}`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      input: prompt,
      max_output_tokens: 300,
      temperature: 0
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI translation failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const text = data?.output_text?.trim();
  if (!text) {
    return `${TODO_PREFIX}${targetLocale}:${input}`;
  }
  return text;
}

async function translateText(input, targetLocale) {
  if (PROVIDER !== "openai") {
    return `${TODO_PREFIX}${targetLocale}:${input}`;
  }
  return translateWithOpenAI(input, targetLocale);
}

async function main() {
  const groups = listMessageGroups();
  if (groups.length === 0) {
    console.log("[i18n:draft] No message groups found.");
    return;
  }

  let totalUpdated = 0;
  const pending = [];

  for (const group of groups) {
    const sourceFile = group.files.find((f) => f.endsWith(`/${SOURCE_LOCALE}.json`));
    if (!sourceFile) continue;

    const source = readJson(sourceFile);
    const keys = flattenKeys(source);

    for (const targetLocale of TARGET_LOCALES) {
      const targetFile = group.files.find((f) => f.endsWith(`/${targetLocale}.json`));
      if (!targetFile) continue;

      const target = readJson(targetFile);
      let mutated = false;

      for (const key of keys) {
        const sourceValue = getByPath(source, key);
        if (typeof sourceValue !== "string") continue;

        const currentTargetValue = getByPath(target, key);
        if (!shouldTranslate(currentTargetValue)) continue;

        if (CHECK_ONLY) {
          pending.push(`${group.appName}:${targetLocale}:${key}`);
          continue;
        }

        const nextValue = await translateText(sourceValue, targetLocale);
        setByPath(target, key, nextValue);
        mutated = true;
        totalUpdated += 1;
      }

      if (!CHECK_ONLY && mutated && !DRY_RUN) {
        writeJson(targetFile, target);
        console.log(`[i18n:draft] updated ${group.appName}/${targetLocale}.json`);
      }
    }
  }

  if (CHECK_ONLY) {
    if (pending.length === 0) {
      console.log("[i18n:draft] check OK (no pending draft translation).\n");
      return;
    }

    console.error("[i18n:draft] check failed. Pending draft translations:");
    for (const item of pending) {
      console.error(`  - ${item}`);
    }
    process.exit(1);
  }

  if (totalUpdated === 0) {
    console.log("[i18n:draft] No target updates needed.");
    return;
  }

  console.log(`[i18n:draft] Completed. Updated ${totalUpdated} value(s).`);
}

main().catch((error) => {
  console.error(`[i18n:draft] failed: ${error.message}`);
  process.exit(1);
});
