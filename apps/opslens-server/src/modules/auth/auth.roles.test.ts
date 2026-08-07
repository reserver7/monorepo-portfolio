import assert from "node:assert/strict";
import test from "node:test";
import { ForbiddenException } from "@nestjs/common";
import { assertOpsPermission } from "./auth.roles.js";

const viewer = { sub: "viewer-1", email: "viewer@example.com", name: "Viewer", role: "viewer" as const };
const operator = { sub: "operator-1", email: "operator@example.com", name: "Operator", role: "operator" as const };
const admin = { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" as const };

test("viewer is limited to read-only access", () => {
  assert.doesNotThrow(() => assertOpsPermission(viewer, "read"));
  assert.throws(() => assertOpsPermission(viewer, "operate"), ForbiddenException);
  assert.throws(() => assertOpsPermission(viewer, "admin"), ForbiddenException);
});

test("operator can operate but cannot administer", () => {
  assert.doesNotThrow(() => assertOpsPermission(operator, "operate"));
  assert.throws(() => assertOpsPermission(operator, "admin"), ForbiddenException);
});

test("admin has every OpsLens permission", () => {
  assert.doesNotThrow(() => assertOpsPermission(admin, "admin"));
});
