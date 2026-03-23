const DEFAULT_SESSION_SECRET = "dev-collab-session-secret";

const toPort = (rawValue: string | undefined, fallback: number): number => {
  if (!rawValue) {
    return fallback;
  }

  const parsedPort = Number(rawValue);
  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    return fallback;
  }

  return parsedPort;
};

const toPositiveInt = (rawValue: string | undefined, fallback: number): number => {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const toBool = (rawValue: string | undefined, fallback: boolean): boolean => {
  if (!rawValue) {
    return fallback;
  }

  if (rawValue === "1" || rawValue.toLowerCase() === "true") {
    return true;
  }

  if (rawValue === "0" || rawValue.toLowerCase() === "false") {
    return false;
  }

  return fallback;
};

const parseCsv = (rawValue: string | undefined): string[] => {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const normalizeCorsOrigin = (rawOrigin: string): string => {
  const value = rawOrigin.trim();
  if (value === "*") {
    return value;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid CORS origin: "${value}"`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`CORS origin must use http/https: "${value}"`);
  }

  if (parsed.username || parsed.password) {
    throw new Error(`CORS origin must not include credentials: "${value}"`);
  }

  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error(`CORS origin must not include path/query/hash: "${value}"`);
  }

  return parsed.origin;
};

const parseCorsOrigins = (rawValue: string | undefined): string[] => {
  return Array.from(new Set(parseCsv(rawValue).map(normalizeCorsOrigin)));
};

export interface ServerEnv {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  corsOrigins: string[];
  allowAllCors: boolean;
  stateFilePath: string | undefined;
  collabSessionSecret: string;
  editorAccessKey: string | undefined;
  socketRateLimitWindowMs: number;
  socketWriteEventsPerWindow: number;
  socketCursorEventsPerWindow: number;
  maxYjsUpdateBase64Chars: number;
  maxSocketJsonChars: number;
}

export const createServerEnv = (rawEnv: NodeJS.ProcessEnv = process.env): ServerEnv => {
  const nodeEnv = (rawEnv.NODE_ENV?.trim() || "development").toLowerCase();
  const isProduction = nodeEnv === "production";

  const corsOrigins = parseCorsOrigins(rawEnv.CORS_ORIGINS);
  const allowAllCorsExplicit = toBool(rawEnv.ALLOW_ALL_CORS, false);
  const allowAllCors = allowAllCorsExplicit || (!isProduction && corsOrigins.length === 0);

  if (isProduction && corsOrigins.includes("*")) {
    throw new Error(
      'CORS_ORIGINS cannot contain "*" in production. Use explicit origins or ALLOW_ALL_CORS=true.'
    );
  }

  if (isProduction && !allowAllCors && corsOrigins.length === 0) {
    throw new Error(
      "CORS_ORIGINS is required in production. Set CORS_ORIGINS or explicitly ALLOW_ALL_CORS=true."
    );
  }

  const collabSessionSecret = rawEnv.COLLAB_SESSION_SECRET?.trim() || DEFAULT_SESSION_SECRET;
  if (isProduction && collabSessionSecret === DEFAULT_SESSION_SECRET) {
    throw new Error("COLLAB_SESSION_SECRET must be configured in production.");
  }

  return {
    nodeEnv,
    isProduction,
    port: toPort(rawEnv.PORT, 4000),
    corsOrigins,
    allowAllCors,
    stateFilePath: rawEnv.STATE_FILE_PATH?.trim() || undefined,
    collabSessionSecret,
    editorAccessKey: rawEnv.EDITOR_ACCESS_KEY?.trim() || undefined,
    socketRateLimitWindowMs: toPositiveInt(rawEnv.SOCKET_RATE_LIMIT_WINDOW_MS, 10_000),
    socketWriteEventsPerWindow: toPositiveInt(rawEnv.SOCKET_WRITE_EVENTS_PER_WINDOW, 120),
    socketCursorEventsPerWindow: toPositiveInt(rawEnv.SOCKET_CURSOR_EVENTS_PER_WINDOW, 300),
    maxYjsUpdateBase64Chars: toPositiveInt(rawEnv.MAX_YJS_UPDATE_BASE64_CHARS, 300_000),
    maxSocketJsonChars: toPositiveInt(rawEnv.MAX_SOCKET_JSON_CHARS, 80_000)
  };
};

export const serverEnv = createServerEnv();
