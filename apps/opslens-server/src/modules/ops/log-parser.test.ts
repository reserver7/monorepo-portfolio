import assert from "node:assert/strict";
import test from "node:test";
import { clusterLogs, normalizeMessage, parseLogLines } from "./log-parser.js";

test("normalizes volatile identifiers so equivalent errors can be grouped", () => {
  assert.equal(
    normalizeMessage("GET /api/orders/123 failed for 550e8400-e29b-41d4-a716-446655440000"),
    "GET /api/orders/<id> failed for <uuid>"
  );
});

test("parses timestamp, level and endpoint metadata", () => {
  const [line] = parseLogLines("2026-08-07T10:00:00Z ERROR GET /api/orders/123 timeout");

  assert.ok(line);
  assert.equal(line.level, "error");
  assert.equal(line.endpoint, "/api/orders/123");
  assert.equal(line.occurredAt.toISOString(), "2026-08-07T10:00:00.000Z");
});

test("clusters repeated normalized messages and assigns operational guidance", () => {
  const lines = parseLogLines(
    [
      "2026-08-07T10:00:00Z ERROR GET /api/orders/123 timeout",
      "2026-08-07T10:01:00Z ERROR GET /api/orders/456 timeout"
    ].join("\n")
  );
  const [cluster] = clusterLogs(lines);

  assert.ok(cluster);
  assert.equal(cluster.count, 2);
  assert.equal(cluster.severity, "critical");
  assert.equal(cluster.affectedArea, "API");
  assert.ok(cluster.suggestedActions.some((action) => action.includes("타임아웃")));
});
