import { mkdir, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const sourceFontPath = resolve(repoRoot, "packages/theme/src/fonts/PretendardVariable.woff2");
const targetFontPaths = [
  "apps/docs/public/fonts/PretendardVariable.woff2",
  "apps/whiteboard/public/fonts/PretendardVariable.woff2",
  "apps/storybook/public/fonts/PretendardVariable.woff2",
  "templates/next-app/public/fonts/PretendardVariable.woff2"
].map((relativePath) => resolve(repoRoot, relativePath));

const run = async () => {
  await Promise.all(
    targetFontPaths.map(async (targetPath) => {
      await mkdir(dirname(targetPath), { recursive: true });
      await copyFile(sourceFontPath, targetPath);
    })
  );

  console.log(`[sync-theme-fonts] synced ${targetFontPaths.length} targets from packages/theme/src/fonts`);
};

await run();

