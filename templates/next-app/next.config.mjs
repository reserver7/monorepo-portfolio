import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNextConfig } from "@repo/configs/next/create-config";

/** @type {import('next').NextConfig} */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextConfig = createNextConfig(__dirname);

export default nextConfig;
