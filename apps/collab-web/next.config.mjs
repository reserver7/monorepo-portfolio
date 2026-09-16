import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNextConfig } from "@repo/configs/next/create-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
export default createNextConfig(__dirname);
