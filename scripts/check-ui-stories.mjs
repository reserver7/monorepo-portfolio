import fs from "node:fs/promises";
import path from "node:path";
import { parseExportedNames } from "./lib/ui-storybook-targets.mjs";

const ROOT = process.cwd();
const COMPONENT_INDEX_PATH = path.join(ROOT, "packages/ui/components/index.ts");
const STORIES_ROOT = path.join(ROOT, "packages/ui/stories");

const collectExistingStoryNames = async () => {
  const names = new Set();

  const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.name.endsWith(".stories.tsx")) continue;
      names.add(entry.name.replace(".stories.tsx", ""));
    }
  };

  await walk(STORIES_ROOT);
  return names;
};

const main = async () => {
  const indexSource = await fs.readFile(COMPONENT_INDEX_PATH, "utf8");
  const expected = parseExportedNames(indexSource);
  const existing = await collectExistingStoryNames();

  const missing = expected.filter((name) => !existing.has(name));

  if (missing.length === 0) {
    console.log(`[storybook:check] OK - 모든 대상 컴포넌트(${expected.length})에 스토리가 있습니다.`);
    return;
  }

  console.error(`[storybook:check] 누락된 스토리: ${missing.length}`);
  console.error(missing.map((name) => `- ${name}`).join("\n"));
  console.error("\n실행: pnpm storybook:gen");
  process.exit(1);
};

main().catch((error) => {
  console.error("[storybook:check] 실패:", error);
  process.exit(1);
});
