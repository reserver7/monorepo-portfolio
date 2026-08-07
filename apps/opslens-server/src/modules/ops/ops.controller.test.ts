import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { UnauthorizedException } from "@nestjs/common";
import { env } from "../../config/env.js";
import { OpsController } from "./ops.controller.js";
import type { OpsService } from "./ops.service.js";

test("ingestion endpoint authenticates and forwards normalized logs", async () => {
  const originalKey = env.OPS_INGESTION_KEY;
  env.OPS_INGESTION_KEY = "test-ingestion-secret-key";
  let received: unknown;
  const controller = new OpsController({
    analyzeLogs: async (input: unknown) => {
      received = input;
      return { createdIssues: 1 };
    }
  } as OpsService);

  try {
    await controller.ingestLogs("test-ingestion-secret-key", {
      environment: "prod",
      serviceName: "checkout-api",
      source: "sentry",
      logs: ["ERROR checkout 1", "ERROR checkout 2"]
    });

    assert.deepEqual(received, {
      environment: "prod",
      serviceName: "checkout-api",
      source: "sentry",
      deploymentVersion: undefined,
      requestedBy: "ingestion:sentry",
      rawLogs: "ERROR checkout 1\nERROR checkout 2",
      clusterLimit: 20
    });
    assert.throws(
      () =>
        controller.ingestLogs("invalid-ingestion-key", {
          environment: "prod",
          serviceName: "api",
          logs: "ERROR"
        }),
      UnauthorizedException
    );
  } finally {
    env.OPS_INGESTION_KEY = originalKey;
  }
});
