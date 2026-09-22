import { createHmac } from "node:crypto";
import {
  extractAccountFromAuthorization,
  extractAccountFromRealtimeToken,
  issueAccountRealtimeToken
} from "./account";

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

describe("실시간 계정 토큰", () => {
  it("짧은 수명의 계정 토큰을 발급하고 검증한다", () => {
    const account = { id: "a", email: "a@example.com", name: "A", role: "viewer" as const };
    const token = issueAccountRealtimeToken(account, "secret", 1_700_000_000_000, 60_000);
    expect(extractAccountFromRealtimeToken(token, "secret", 1_700_000_030)).toEqual(account);
  });

  it("만료된 실시간 계정 토큰을 거부한다", () => {
    const account = { id: "a", email: "a@example.com", name: "A", role: "viewer" as const };
    const token = issueAccountRealtimeToken(account, "secret", 1_700_000_000_000, 60_000);
    expect(extractAccountFromRealtimeToken(token, "secret", 1_700_000_061)).toBeNull();
  });
});
