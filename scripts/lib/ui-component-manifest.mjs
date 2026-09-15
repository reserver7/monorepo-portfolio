import fs from "node:fs";
import path from "node:path";

export const loadUiComponentManifest = (rootDir) => {
  const filePath = path.join(rootDir, "packages/ui/metadata/component-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return manifest.map((entry) => ({
    ...entry,
    exportPath: entry.exportPath ?? `@repo/ui/components/${entry.name}`,
    displayName: entry.displayName ?? entry.name,
    defaultArgs: entry.defaultArgs ?? {},
    controls: entry.controls ?? {}
  }));
};
