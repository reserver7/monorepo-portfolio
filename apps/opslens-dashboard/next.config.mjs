import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNextConfig } from "@repo/configs/next/create-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = createNextConfig(__dirname);

export default nextConfig;
