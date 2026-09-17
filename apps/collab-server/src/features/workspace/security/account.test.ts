import { createHmac } from "node:crypto";
import { extractAccountFromAuthorization } from "./account";

const tokenFor = (payload: Record<string, unknown>, secret: string): string => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "HS256", typ: "OPS-BRIDGE" })}.${encode(payload)}`;
  return `${unsigned}.${createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
};

describe("계정 세션 검증", () => {
  it("유효한 OpsLens 세션에서 계정 식별자를 추출한다", () => {
    const token = tokenFor(
      {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "viewer",
        type: "session",
        exp: 2_000_000_000
      },
      "bridge-secret"
    );

    expect(extractAccountFromAuthorization(`Bearer ${token}`, "bridge-secret")).toEqual({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      role: "viewer"
    });
  });

  it("만료되거나 위조된 세션을 거부한다", () => {
    const token = tokenFor(
      { id: "user-1", email: "user@example.com", name: "User", role: "viewer", type: "session", exp: 1 },
      "bridge-secret"
    );

    expect(extractAccountFromAuthorization(`Bearer ${token}`, "bridge-secret")).toBeNull();
    expect(extractAccountFromAuthorization("Bearer forged", "bridge-secret")).toBeNull();
  });
});
