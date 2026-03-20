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

const parseCsv = (rawValue: string | undefined): string[] => {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export const serverEnv = {
  port: toPort(process.env.PORT, 4000),
  corsOrigins: parseCsv(process.env.CORS_ORIGINS),
  stateFilePath: process.env.STATE_FILE_PATH?.trim() || undefined
};
