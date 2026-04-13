const SENSITIVE_ENV_KEY_PATTERN =
  /(TOKEN|SECRET|PASSWORD|PASS|API_KEY|AUTH|COOKIE|PRIVATE|ACCESS_KEY|SESSION_KEY)/i;

const redactSensitiveEnv = (): void => {
  for (const key of Object.keys(process.env)) {
    if (SENSITIVE_ENV_KEY_PATTERN.test(key)) {
      process.env[key] = "[REDACTED]";
    }
  }

  process.env.NODE_ENV = "test";
  process.env.TZ = process.env.TZ || "UTC";
};

redactSensitiveEnv();
