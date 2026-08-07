import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createNextConfig } from "@repo/configs/next/create-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const isAnalyze = process.env.ANALYZE === "true";

/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' http: https: ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
];

const nextConfig = createNextConfig(__dirname, {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  }
});

let withBundleAnalyzer = (config) => config;
if (isAnalyze) {
  try {
    withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: true });
  } catch {
    withBundleAnalyzer = (config) => config;
  }
}

export default withBundleAnalyzer(nextConfig);
