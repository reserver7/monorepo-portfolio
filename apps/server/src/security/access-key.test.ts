import {
  createStoredEditorAccessKey,
  normalizeStoredEditorAccessKey,
  sanitizeEditorAccessKey,
  verifyEditorAccessKey
} from "./access-key";

describe("편집 키 보안 유틸", () => {
  it("입력 편집 키를 trim하고 길이를 제한한다", () => {
    expect(sanitizeEditorAccessKey("   ")).toBeUndefined();
    expect(sanitizeEditorAccessKey(" 1234 ")).toBe("1234");

    const longValue = "a".repeat(160);
    expect(sanitizeEditorAccessKey(longValue)?.length).toBe(120);
  });

  it("생성 시 편집 키를 해시로 저장한다", () => {
    const stored = createStoredEditorAccessKey("1234");
    expect(stored).toBeDefined();
    expect(stored).toContain("ek1$");
    expect(stored).not.toBe("1234");

    expect(verifyEditorAccessKey(stored, "1234")).toBe(true);
    expect(verifyEditorAccessKey(stored, "9999")).toBe(false);
  });

  it("레거시 평문 키는 normalize 시 해시로 전환한다", () => {
    const normalized = normalizeStoredEditorAccessKey("legacy-key");
    expect(normalized).toBeDefined();
    expect(normalized).toContain("ek1$");
    expect(normalized).not.toBe("legacy-key");
    expect(verifyEditorAccessKey(normalized, "legacy-key")).toBe(true);
  });

  it("이미 해시된 저장값은 normalize해도 유지한다", () => {
    const hashed = createStoredEditorAccessKey("same-key");
    const normalized = normalizeStoredEditorAccessKey(hashed);
    expect(normalized).toBe(hashed);
  });

  it("레거시 평문 저장값도 검증 함수에서 호환된다", () => {
    expect(verifyEditorAccessKey("plain-key", "plain-key")).toBe(true);
    expect(verifyEditorAccessKey("plain-key", "wrong")).toBe(false);
  });
});
