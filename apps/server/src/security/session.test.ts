import { issueSessionToken, verifySessionToken } from "./session";

describe("세션 토큰", () => {
  it("정상 토큰은 발급 후 검증된다", () => {
    const token = issueSessionToken("session-123", "secret-key", 1_700_000_000_000, 10_000);
    const result = verifySessionToken(token, "secret-key", 1_700_000_001_000);

    expect(result).toEqual({
      valid: true,
      sessionId: "session-123"
    });
  });

  it("다른 비밀키로 검증하면 거부된다", () => {
    const token = issueSessionToken("session-123", "secret-key");
    const result = verifySessionToken(token, "another-secret");

    expect(result).toEqual({ valid: false });
  });

  it("위변조된 토큰은 거부된다", () => {
    const token = issueSessionToken("session-123", "secret-key");
    const tampered = `${token}x`;
    const result = verifySessionToken(tampered, "secret-key");

    expect(result).toEqual({ valid: false });
  });

  it("만료된 토큰은 거부된다", () => {
    const token = issueSessionToken("session-123", "secret-key", 1_700_000_000_000, 1000);
    const result = verifySessionToken(token, "secret-key", 1_700_000_005_000);

    expect(result).toEqual({ valid: false });
  });

  it("형식이 잘못된 토큰은 거부된다", () => {
    const result = verifySessionToken("invalid-token", "secret-key");
    expect(result).toEqual({ valid: false });
  });

  it("만료 시각과 현재 시각이 같으면 유효하다", () => {
    const now = 1_700_000_000_000;
    const token = issueSessionToken("session-123", "secret-key", now, 10_000);
    const result = verifySessionToken(token, "secret-key", now + 10_000);

    expect(result).toEqual({
      valid: true,
      sessionId: "session-123"
    });
  });

  it("공백 세션 ID 토큰은 거부된다", () => {
    const token = issueSessionToken("   ", "secret-key");
    const result = verifySessionToken(token, "secret-key");

    expect(result).toEqual({ valid: false });
  });

  it("토큰 버전이 다르면 거부된다", () => {
    const token = issueSessionToken("session-123", "secret-key");
    const invalidVersionToken = token.replace("v1.", "v2.");
    const result = verifySessionToken(invalidVersionToken, "secret-key");

    expect(result).toEqual({ valid: false });
  });
});
