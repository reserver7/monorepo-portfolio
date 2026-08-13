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

test("metric ingestion authenticates and forwards service totals", async () => {
  const originalKey = env.OPS_INGESTION_KEY;
  env.OPS_INGESTION_KEY = "test-ingestion-secret-key";
  let received: unknown;
  const controller = new OpsController({
    ingestServiceMetric: async (input: unknown) => {
      received = input;
      return true;
    }
  } as OpsService);
  try {
    await controller.ingestMetrics("test-ingestion-secret-key", { environment: "prod", serviceName: "checkout-api", requests: 120, errors: 3, latencyP95Ms: 240 });
    assert.deepEqual(received, { environment: "prod", serviceName: "checkout-api", requests: 120, errors: 3, latencyP95Ms: 240, occurredAt: undefined });
  } finally {
    env.OPS_INGESTION_KEY = originalKey;
  }
});

test("CI webhook authenticates and forwards deployment status", async () => {
  const originalKey = env.OPS_INGESTION_KEY;
  env.OPS_INGESTION_KEY = "test-ingestion-secret-key";
  let received: unknown;
  const controller = new OpsController({ syncDeploymentCiStatus: async (input: unknown) => { received = input; return true; } } as OpsService);
  try {
    await controller.ingestCiStatus("test-ingestion-secret-key", { environment: "prod", version: "2026.08.13.1", status: "success", ciUrl: "https://ci.example.test/run/1" });
    assert.deepEqual(received, { environment: "prod", version: "2026.08.13.1", status: "success", ciUrl: "https://ci.example.test/run/1" });
  } finally {
    env.OPS_INGESTION_KEY = originalKey;
  }
});
