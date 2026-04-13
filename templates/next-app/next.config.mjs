import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNextConfig } from "../../packages/configs/src/next/create-next-config.mjs";

/** @type {import('next').NextConfig} */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextConfig = createNextConfig(__dirname);

export default nextConfig;
