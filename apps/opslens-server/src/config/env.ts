import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFiles(): void {
  const candidates = [
    resolve(process.cwd(), "apps/opslens-server/.env"),
    resolve(process.cwd(), ".env"),
    resolve(__dirname, "../../../.env"),
    resolve(__dirname, "../../../../../.env")
  ];

  const seen = new Set<string>();
  for (const path of candidates) {
    if (seen.has(path)) continue;
    seen.add(path);
    if (!existsSync(path)) continue;
    loadDotenv({ path, override: false });
  }
}

loadEnvFiles();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4100),
  DATABASE_URL: z.string().min(1),
  AI_PROVIDER: z.enum(["gemini", "none"]).default("gemini"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(6).default(3),
  AI_RETRY_BASE_DELAY_MS: z.coerce.number().int().min(100).max(10000).default(700),
  AI_CACHE_TTL_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60 * 60 * 1000)
    .default(120000)
});

export type ServerEnv = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  AI_PROVIDER: process.env.AI_PROVIDER,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  AI_MAX_RETRIES: process.env.AI_MAX_RETRIES,
  AI_RETRY_BASE_DELAY_MS: process.env.AI_RETRY_BASE_DELAY_MS,
  AI_CACHE_TTL_MS: process.env.AI_CACHE_TTL_MS
});

if (!parsed.success) {
  throw new Error(
    [
      "OpsLens Server 환경변수 설정이 누락되었습니다.",
      "필수: DATABASE_URL",
      "파일 경로: apps/opslens-server/.env",
      "예시: DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require"
    ].join("\n")
  );
}

export const env: ServerEnv = parsed.data;
