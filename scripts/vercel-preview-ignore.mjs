import { execFileSync } from "node:child_process";

const [appDirectory] = process.argv.slice(2);

if (!appDirectory) {
  console.error("Usage: vercel-preview-ignore.mjs <app-directory>");
  process.exit(1);
}

if (process.env.VERCEL_ENV === "production") {
  console.log("Production deployments always build.");
  process.exit(1);
}

let changedFiles;
try {
  changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
} catch {
  console.log("Unable to determine changed files; proceeding with deployment.");
  process.exit(1);
}

const sharedBuildInputs = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  "tsconfig.json",
]);

const hasBuildImpact = changedFiles.some(
  (file) =>
    file.startsWith(`${appDirectory}/`) ||
    file.startsWith("packages/") ||
    file.startsWith("scripts/") ||
    sharedBuildInputs.has(file),
);

if (hasBuildImpact) {
  console.log(`Changes affect ${appDirectory}; proceeding with deployment.`);
  process.exit(1);
}

console.log(`No build inputs affect ${appDirectory}; skipping preview build.`);
