import fs from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();
export const APPS_DIR = path.join(ROOT, "apps");

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObject(value[key]);
        return acc;
      }, {});
  }

  return value;
}

export function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(sortObject(data), null, 2)}\n`, "utf8");
}

export function flattenKeys(obj, prefix = "") {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }

  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return prefix ? [prefix] : [];
  }

  return entries.flatMap(([key, value]) => flattenKeys(value, prefix ? `${prefix}.${key}` : key));
}

export function getByPath(obj, keyPath) {
  return keyPath.split(".").reduce((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return acc[key];
  }, obj);
}

export function setByPath(obj, keyPath, value) {
  const keys = keyPath.split(".");
  let cursor = obj;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (!(key in cursor) || cursor[key] === null || typeof cursor[key] !== "object" || Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }

  cursor[keys[keys.length - 1]] = value;
}

export function listMessageGroups() {
  if (!fs.existsSync(APPS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(APPS_DIR)
    .filter((name) => fs.statSync(path.join(APPS_DIR, name)).isDirectory())
    .map((appName) => {
      const dir = path.join(APPS_DIR, appName, "lib", "i18n", "messages");
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        return null;
      }

      const files = fs
        .readdirSync(dir)
        .filter((name) => name.endsWith(".json"))
        .map((name) => path.join(dir, name))
        .sort();

      if (files.length === 0) {
        return null;
      }

      const baseFile =
        files.find((file) => path.basename(file).toLowerCase() === "ko.json") ?? files[0];

      return {
        appName,
        dir,
        files,
        baseFile,
        locales: files.map((file) => path.basename(file, ".json"))
      };
    })
    .filter(Boolean);
}
