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
  AUTH_JWT_SECRET: z.string().min(16).default("opslens-local-dev-secret-change-me"),
  AUTH_ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().min(300).max(86400).default(28800),
  AUTH_REFRESH_TOKEN_TTL_SEC: z.coerce.number().int().min(3600).max(60 * 60 * 24 * 90).default(1209600),
  AUTH_LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
  AUTH_LOGIN_WINDOW_SEC: z.coerce.number().int().min(60).max(3600).default(600),
  AUTH_LOGIN_BLOCK_SEC: z.coerce.number().int().min(60).max(3600 * 6).default(900),
  AUTH_BRIDGE_SECRET: z.string().min(16).default("opslens-auth-bridge-secret-change-me"),
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
    .default(120000),
  OPS_CACHE_DASHBOARD_SUMMARY_TTL_MS: z.coerce.number().int().min(1000).max(5 * 60 * 1000).default(30000),
  OPS_CACHE_DASHBOARD_SUMMARY_MAX: z.coerce.number().int().min(10).max(5000).default(200),
  OPS_CACHE_DASHBOARD_BRIEFING_TTL_MS: z.coerce.number().int().min(1000).max(10 * 60 * 1000).default(90000),
  OPS_CACHE_DASHBOARD_BRIEFING_MAX: z.coerce.number().int().min(10).max(5000).default(200),
  OPS_CACHE_DEPLOYMENT_IMPACT_TTL_MS: z.coerce.number().int().min(1000).max(5 * 60 * 1000).default(30000),
  OPS_CACHE_DEPLOYMENT_IMPACT_MAX: z.coerce.number().int().min(10).max(5000).default(200),
  OPS_CACHE_ISSUE_LIST_TTL_MS: z.coerce.number().int().min(1000).max(5 * 60 * 1000).default(15000),
  OPS_CACHE_ISSUE_LIST_MAX: z.coerce.number().int().min(10).max(10000).default(300),
  OPS_CACHE_QA_SCENARIO_TTL_MS: z.coerce.number().int().min(1000).max(5 * 60 * 1000).default(15000)
});

export type ServerEnv = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET,
  AUTH_ACCESS_TOKEN_TTL_SEC: process.env.AUTH_ACCESS_TOKEN_TTL_SEC,
  AUTH_REFRESH_TOKEN_TTL_SEC: process.env.AUTH_REFRESH_TOKEN_TTL_SEC,
  AUTH_LOGIN_MAX_ATTEMPTS: process.env.AUTH_LOGIN_MAX_ATTEMPTS,
  AUTH_LOGIN_WINDOW_SEC: process.env.AUTH_LOGIN_WINDOW_SEC,
  AUTH_LOGIN_BLOCK_SEC: process.env.AUTH_LOGIN_BLOCK_SEC,
  AUTH_BRIDGE_SECRET: process.env.AUTH_BRIDGE_SECRET,
  AI_PROVIDER: process.env.AI_PROVIDER,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  AI_MAX_RETRIES: process.env.AI_MAX_RETRIES,
  AI_RETRY_BASE_DELAY_MS: process.env.AI_RETRY_BASE_DELAY_MS,
  AI_CACHE_TTL_MS: process.env.AI_CACHE_TTL_MS,
  OPS_CACHE_DASHBOARD_SUMMARY_TTL_MS: process.env.OPS_CACHE_DASHBOARD_SUMMARY_TTL_MS,
  OPS_CACHE_DASHBOARD_SUMMARY_MAX: process.env.OPS_CACHE_DASHBOARD_SUMMARY_MAX,
  OPS_CACHE_DASHBOARD_BRIEFING_TTL_MS: process.env.OPS_CACHE_DASHBOARD_BRIEFING_TTL_MS,
  OPS_CACHE_DASHBOARD_BRIEFING_MAX: process.env.OPS_CACHE_DASHBOARD_BRIEFING_MAX,
  OPS_CACHE_DEPLOYMENT_IMPACT_TTL_MS: process.env.OPS_CACHE_DEPLOYMENT_IMPACT_TTL_MS,
  OPS_CACHE_DEPLOYMENT_IMPACT_MAX: process.env.OPS_CACHE_DEPLOYMENT_IMPACT_MAX,
  OPS_CACHE_ISSUE_LIST_TTL_MS: process.env.OPS_CACHE_ISSUE_LIST_TTL_MS,
  OPS_CACHE_ISSUE_LIST_MAX: process.env.OPS_CACHE_ISSUE_LIST_MAX,
  OPS_CACHE_QA_SCENARIO_TTL_MS: process.env.OPS_CACHE_QA_SCENARIO_TTL_MS
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
