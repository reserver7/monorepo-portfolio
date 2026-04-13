import { mkdir, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const sourceFontPath = resolve(repoRoot, "packages/theme/src/fonts/PretendardVariable.woff2");
const targetFontPaths = [];

const run = async () => {
  await Promise.all(
    targetFontPaths.map(async (targetPath) => {
      await mkdir(dirname(targetPath), { recursive: true });
      await copyFile(sourceFontPath, targetPath);
    })
  );

  console.log(
    `[sync-theme-fonts] app public font sync skipped (bundle font from packages/theme/src/fonts: ${sourceFontPath})`
  );
};

await run();
