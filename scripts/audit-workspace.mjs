#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const appsDir = path.join(rootDir, "apps");
const frontendApps = ["collab-web", "opslens-dashboard"];
const allApps = fs
  .readdirSync(appsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const errors = [];
const warnings = [];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const readText = (filePath) => fs.readFileSync(filePath, "utf8");

const listFiles = (dirPath, exts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css"]) => {
  const out = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".turbo") continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (exts.includes(path.extname(entry.name))) out.push(fullPath);
    }
  };
  walk(dirPath);
  return out;
};

const relative = (filePath) => path.relative(rootDir, filePath);

// 1) Frontend globals.css must import shared global.css
for (const appName of frontendApps) {
  const globalsPath = path.join(appsDir, appName, "app", "globals.css");
  if (!fs.existsSync(globalsPath)) {
    errors.push(`[${appName}] missing app/globals.css`);
    continue;
  }
  const text = readText(globalsPath);
  if (!text.includes('@import "@repo/configs/global.css";')) {
    errors.push(`[${appName}] app/globals.css must import "@repo/configs/global.css"`);
  }
}

// 2) Prevent deep package imports from apps (must use public entrypoints)
const bannedPatterns = [
  /from\s+["']@repo\/ui\/components\//,
  /from\s+["']@repo\/ui\/styles\//,
  /from\s+["']\.\.\/\.\.\/packages\//
];

for (const appName of allApps) {
  const appPath = path.join(appsDir, appName);
  for (const filePath of listFiles(appPath)) {
    const text = readText(filePath);
    for (const pattern of bannedPatterns) {
      if (pattern.test(text)) {
        errors.push(`[${appName}] banned deep import in ${relative(filePath)}`);
      }
    }
  }
}

// 3) Ensure @repo/* imports are declared in app package.json dependencies/devDependencies
const importRegex = /from\s+["'](@repo\/[^"']+)["']/g;
for (const appName of allApps) {
  const appPath = path.join(appsDir, appName);
  const pkgPath = path.join(appPath, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = readJson(pkgPath);
  const depMap = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const importedPackages = new Set();

  for (const filePath of listFiles(appPath)) {
    const text = readText(filePath);
    let match;
    while ((match = importRegex.exec(text)) !== null) {
      const packageId = match[1].split("/").slice(0, 2).join("/");
      importedPackages.add(packageId);
    }
  }

  for (const packageId of importedPackages) {
    if (!depMap[packageId]) {
      errors.push(`[${appName}] imports ${packageId} but package.json does not declare it`);
    }
  }
}

// 4) Frontend app structure consistency
for (const appName of frontendApps) {
  const appPath = path.join(appsDir, appName);
  const requiredDirs = ["app", "features", "lib"];
  for (const dirName of requiredDirs) {
    if (!fs.existsSync(path.join(appPath, dirName))) {
      warnings.push(`[${appName}] missing recommended directory: ${dirName}`);
    }
  }
}

if (warnings.length) {
  console.log("Workspace audit warnings:");
  for (const warning of warnings) console.log(`  - ${warning}`);
}

if (errors.length) {
  console.error("Workspace audit failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log("Workspace audit passed.");
