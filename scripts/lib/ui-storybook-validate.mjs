import fs from "node:fs/promises";
import path from "node:path";

const listStoryFiles = async (dirPath) => {
  const files = [];
  const walk = async (currentPath) => {
    let entries = [];
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const nextPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(nextPath);
        continue;
      }
      if (entry.name.endsWith(".stories.tsx")) files.push(nextPath);
    }
  };
  await walk(dirPath);
  return files;
};

const collectArgTypesDuplicateKeys = (source) => {
  const duplicates = [];
  const lines = source.split("\n");
  let inArgTypes = false;
  let depth = 0;
  let seen = new Set();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!inArgTypes) {
      if (/^argTypes:\s*\{/.test(line)) {
        inArgTypes = true;
        depth = 1;
        seen = new Set();
      }
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z_$][\w$]*)\s*:/);
    // `depth` is 1 while reading direct children of the argTypes object.
    // Inspect the key before applying this line's braces so multiline
    // configs such as `size: { control: ... }` do not make nested keys look
    // like duplicate top-level argTypes entries.
    if (keyMatch && depth === 1) {
      const key = keyMatch[1];
      if (seen.has(key)) duplicates.push(key);
      else seen.add(key);
    }

    for (const ch of line) {
      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;
    }

    if (depth <= 0) {
      inArgTypes = false;
      depth = 0;
      seen = new Set();
    }
  }

  return [...new Set(duplicates)];
};

export const validateGeneratedStories = async (generatedDirPath) => {
  const files = await listStoryFiles(generatedDirPath);
  const errors = [];

  for (const filePath of files) {
    const source = await fs.readFile(filePath, "utf8");

    if (!source.includes("export const Playground")) {
      errors.push({ filePath, reason: "Playground 스토리 누락" });
    }

    const duplicateKeys = collectArgTypesDuplicateKeys(source);
    if (duplicateKeys.length > 0) {
      errors.push({ filePath, reason: `argTypes 중복 키: ${duplicateKeys.join(", ")}` });
    }
  }

  return { fileCount: files.length, errors };
};
