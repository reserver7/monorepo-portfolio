const EXCLUDED_EXPORTS = new Set([
  "cn",
  "buttonVariants",
  "chartColorTokens",
  "alert",
  "confirm",
  "promptConfirm",
  "useAlertConfirm"
]);

const EXCLUDED_EXACT = new Set([
  "AlertConfirmProvider",
  "DataTableColumnHeader",
  "SelectRoot"
]);

const EXCLUDED_SUFFIXES = [
  "Provider",
  "Root",
  "Trigger",
  "Content",
  "Header",
  "Footer",
  "Title",
  "Description",
  "Portal",
  "Overlay",
  "Close",
  "Separator",
  "Shortcut",
  "Sub",
  "Group",
  "Item",
  "Row",
  "Cell",
  "Head",
  "Body",
  "Caption",
  "Fallback",
  "Image",
  "Action",
  "Cancel",
  "Bar"
];

const toPascalCase = (value) =>
  value
    .split(/[-_\/]/g)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join("");

export const shouldSkipExport = (name) => {
  if (!name) return true;
  if (name === "Input") return false;
  if (name === "RadioGroup") return false;
  if (EXCLUDED_EXPORTS.has(name)) return true;
  if (EXCLUDED_EXACT.has(name)) return true;
  if (!/^[A-Z]/.test(name)) return true;
  if (/(Props|Options|Input|ColumnDef)$/.test(name)) return true;
  if (EXCLUDED_SUFFIXES.some((suffix) => name.endsWith(suffix))) return true;
  return false;
};

const pickPrimaryExportFromModule = (modulePath, exportsFromModule) => {
  const moduleName = modulePath.replace(/^\.\//, "").split("/").pop() ?? "";
  const canonicalName = toPascalCase(moduleName);

  if (exportsFromModule.includes(canonicalName) && !shouldSkipExport(canonicalName)) {
    return canonicalName;
  }

  return exportsFromModule.find((name) => !shouldSkipExport(name)) ?? null;
};

export const parseExportedNames = (source) => {
  const names = new Set();
  const exportBlockRegex = /export\s*\{([\s\S]*?)\}\s*from\s*"(\.\/[^\"]+)";/g;

  for (const match of source.matchAll(exportBlockRegex)) {
    const exportsRaw = match[1];
    const modulePath = match[2];

    const tokens = exportsRaw
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean)
      .map((token) => token.replace(/^type\s+/, "").trim())
      .map((token) => token.split(/\s+as\s+/i)[0]?.trim())
      .filter(Boolean);

    const primary = pickPrimaryExportFromModule(modulePath, tokens);
    if (primary) names.add(primary);
  }

  return [...names].sort((a, b) => a.localeCompare(b));
};
