type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

export interface StructuredLogger {
  debug: (event: string, context?: LogContext) => void;
  info: (event: string, context?: LogContext) => void;
  warn: (event: string, context?: LogContext) => void;
  error: (event: string, context?: LogContext) => void;
  child: (defaults: LogContext) => StructuredLogger;
}

const createLogMethod = (
  level: LogLevel,
  baseContext: LogContext
): ((event: string, context?: LogContext) => void) => {
  return (event, context) => {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...baseContext,
      ...(context ?? {})
    };

    const serialized = JSON.stringify(payload);
    if (level === "error") {
      console.error(serialized);
      return;
    }

    if (level === "warn") {
      console.warn(serialized);
      return;
    }

    console.log(serialized);
  };
};

export const createLogger = (baseContext: LogContext = {}): StructuredLogger => {
  return {
    debug: createLogMethod("debug", baseContext),
    info: createLogMethod("info", baseContext),
    warn: createLogMethod("warn", baseContext),
    error: createLogMethod("error", baseContext),
    child: (defaults: LogContext) => createLogger({ ...baseContext, ...defaults })
  };
};
