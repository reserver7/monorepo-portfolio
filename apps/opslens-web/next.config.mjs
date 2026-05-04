import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createNextConfig } from "@repo/configs/next/create-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const isAnalyze = process.env.ANALYZE === "true";

/** @type {import('next').NextConfig} */
const nextConfig = createNextConfig(__dirname);

let withBundleAnalyzer = (config) => config;
if (isAnalyze) {
  try {
    withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: true });
  } catch {
    withBundleAnalyzer = (config) => config;
  }
}

export default withBundleAnalyzer(nextConfig);
