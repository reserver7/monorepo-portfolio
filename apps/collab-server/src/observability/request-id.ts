import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { StructuredLogger } from "./logger";

const REQUEST_ID_HEADER = "x-request-id";
const REQUEST_ID_KEY = "__requestId";

type RequestWithId = Request & {
  [REQUEST_ID_KEY]?: string;
};

const resolveRequestId = (rawValue: string | undefined): string => {
  const trimmed = rawValue?.trim();
  if (trimmed) {
    return trimmed.slice(0, 120);
  }

  return randomUUID();
};

export const getRequestId = (req: Request): string => {
  const withId = req as RequestWithId;
  return withId[REQUEST_ID_KEY] ?? "";
};

export const requestObservabilityMiddleware = (logger: StructuredLogger) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const withId = req as RequestWithId;
    const requestId = resolveRequestId(req.header(REQUEST_ID_HEADER) ?? undefined);
    const startedAtMs = Date.now();

    withId[REQUEST_ID_KEY] = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    res.on("finish", () => {
      logger.info("http.request.completed", {
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAtMs,
        ip: req.ip
      });
    });

    next();
  };
};
