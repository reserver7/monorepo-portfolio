import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const WATCH_ROOTS = [
  path.join(ROOT, "packages/ui/components"),
  path.join(ROOT, "scripts/lib"),
  path.join(ROOT, "scripts/generate-ui-stories.mjs")
];

const POLL_INTERVAL_MS = 1200;
let isGenerating = false;
let lastSignature = "";

const collectFiles = async (targetPath) => {
  const stat = await fs.stat(targetPath);
  if (stat.isFile()) {
    return [targetPath];
  }

  const queue = [targetPath];
  const files = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(next);
        continue;
      }
      if (!/\.(ts|tsx|js|mjs)$/.test(entry.name)) continue;
      files.push(next);
    }
  }

  return files;
};

const buildSignature = async () => {
  const allFiles = [];
  for (const target of WATCH_ROOTS) {
    try {
      const files = await collectFiles(target);
      allFiles.push(...files);
    } catch {
      // ignore missing paths
    }
  }

  allFiles.sort((a, b) => a.localeCompare(b));
  const signatures = await Promise.all(
    allFiles.map(async (filePath) => {
      const stat = await fs.stat(filePath);
      return `${filePath}:${stat.mtimeMs}`;
    })
  );
  return signatures.join("|");
};

const runGenerate = async () => {
  if (isGenerating) return;
  isGenerating = true;

  await new Promise((resolve, reject) => {
    const child = spawn("node", ["./scripts/generate-ui-stories.mjs"], {
      cwd: ROOT,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`[storybook:watch] story gen failed with code ${code}`));
    });
    child.on("error", reject);
  }).catch((error) => {
    console.error(String(error));
  });

  isGenerating = false;
};

const tick = async () => {
  const signature = await buildSignature();
  if (signature === lastSignature) return;
  lastSignature = signature;
  await runGenerate();
};

const start = async () => {
  console.log("[storybook:watch] watching UI components for story auto-generation...");
  await tick();
  setInterval(() => {
    void tick();
  }, POLL_INTERVAL_MS);
};

start().catch((error) => {
  console.error("[storybook:watch] failed:", error);
  process.exit(1);
});

