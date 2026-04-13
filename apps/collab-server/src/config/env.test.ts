import { createServerEnv } from "./env";

const PROD_STATE_FILE_PATH = "/tmp/monorepo-portfolio-prod-state.json";

describe("서버 환경 변수 파싱", () => {
  it("개발 환경에서는 안전한 기본값을 사용한다", () => {
    const env = createServerEnv({});

    expect(env.nodeEnv).toBe("development");
    expect(env.isProduction).toBe(false);
    expect(env.port).toBe(4000);
    expect(env.allowAllCors).toBe(true);
    expect(env.corsOrigins).toEqual([]);
    expect(env.collabSessionSecret).toBe("dev-collab-session-secret");
  });

  it("운영 환경에서 CORS 설정이 없으면 즉시 실패한다", () => {
    expect(() =>
      createServerEnv({
        NODE_ENV: "production",
        COLLAB_SESSION_SECRET: "test-secret"
      })
    ).toThrow("CORS_ORIGINS is required in production");
  });

  it("운영 환경에서 명시한 CORS 목록을 공백 없이 정규화한다", () => {
    const env = createServerEnv({
      NODE_ENV: "production",
      CORS_ORIGINS: " https://docs.example.com,https://whiteboard.example.com ",
      COLLAB_SESSION_SECRET: "test-secret",
      STATE_FILE_PATH: PROD_STATE_FILE_PATH
    });

    expect(env.isProduction).toBe(true);
    expect(env.allowAllCors).toBe(false);
    expect(env.corsOrigins).toEqual(["https://docs.example.com", "https://whiteboard.example.com"]);
  });

  it("CORS_ORIGINS는 중복/슬래시를 정규화해 단일 origin 목록으로 만든다", () => {
    const env = createServerEnv({
      NODE_ENV: "production",
      CORS_ORIGINS:
        "https://docs.example.com/, https://docs.example.com, http://localhost:3000/,http://localhost:3000",
      COLLAB_SESSION_SECRET: "test-secret",
      STATE_FILE_PATH: PROD_STATE_FILE_PATH
    });

    expect(env.corsOrigins).toEqual(["https://docs.example.com", "http://localhost:3000"]);
  });

  it("운영 환경에서 ALLOW_ALL_CORS를 명시하면 허용한다", () => {
    const env = createServerEnv({
      NODE_ENV: "production",
      ALLOW_ALL_CORS: "true",
      COLLAB_SESSION_SECRET: "test-secret",
      STATE_FILE_PATH: PROD_STATE_FILE_PATH
    });

    expect(env.isProduction).toBe(true);
    expect(env.allowAllCors).toBe(true);
  });

  it("운영 환경에서 와일드카드 CORS_ORIGINS는 즉시 실패한다", () => {
    expect(() =>
      createServerEnv({
        NODE_ENV: "production",
        CORS_ORIGINS: "*",
        COLLAB_SESSION_SECRET: "test-secret"
      })
    ).toThrow('CORS_ORIGINS cannot contain "*" in production');
  });

  it("CORS_ORIGINS에 경로/쿼리/해시가 포함되면 즉시 실패한다", () => {
    expect(() =>
      createServerEnv({
        NODE_ENV: "production",
        CORS_ORIGINS: "https://docs.example.com/app",
        COLLAB_SESSION_SECRET: "test-secret"
      })
    ).toThrow("CORS origin must not include path/query/hash");

    expect(() =>
      createServerEnv({
        NODE_ENV: "production",
        CORS_ORIGINS: "https://docs.example.com?preview=1",
        COLLAB_SESSION_SECRET: "test-secret"
      })
    ).toThrow("CORS origin must not include path/query/hash");
  });

  it("CORS_ORIGINS는 http/https 스킴만 허용한다", () => {
    expect(() =>
      createServerEnv({
        NODE_ENV: "production",
        CORS_ORIGINS: "ws://localhost:3000",
        COLLAB_SESSION_SECRET: "test-secret"
      })
    ).toThrow("CORS origin must use http/https");
  });

  it("운영 환경에서는 COLLAB_SESSION_SECRET이 필수다", () => {
    expect(() =>
      createServerEnv({
        NODE_ENV: "production",
        CORS_ORIGINS: "https://docs.example.com",
        STATE_FILE_PATH: PROD_STATE_FILE_PATH
      })
    ).toThrow("COLLAB_SESSION_SECRET must be configured in production");
  });

  it("운영 환경에서는 STATE_FILE_PATH가 필수다", () => {
    expect(() =>
      createServerEnv({
        NODE_ENV: "production",
        CORS_ORIGINS: "https://docs.example.com",
        COLLAB_SESSION_SECRET: "test-secret"
      })
    ).toThrow("STATE_FILE_PATH must be configured in production");
  });

  it("숫자 제한 값이 비정상이면 기본값으로 대체한다", () => {
    const env = createServerEnv({
      PORT: "abc",
      SOCKET_RATE_LIMIT_WINDOW_MS: "-1",
      SOCKET_WRITE_EVENTS_PER_WINDOW: "0",
      SOCKET_CURSOR_EVENTS_PER_WINDOW: "not-a-number",
      MAX_YJS_UPDATE_BASE64_CHARS: "1.2",
      MAX_SOCKET_JSON_CHARS: ""
    });

    expect(env.port).toBe(4000);
    expect(env.socketRateLimitWindowMs).toBe(10_000);
    expect(env.socketWriteEventsPerWindow).toBe(120);
    expect(env.socketCursorEventsPerWindow).toBe(300);
    expect(env.maxYjsUpdateBase64Chars).toBe(300_000);
    expect(env.maxSocketJsonChars).toBe(80_000);
  });

  it("ALLOW_ALL_CORS는 1/0 문자열도 파싱한다", () => {
    const allow = createServerEnv({
      NODE_ENV: "production",
      ALLOW_ALL_CORS: "1",
      COLLAB_SESSION_SECRET: "test-secret",
      STATE_FILE_PATH: PROD_STATE_FILE_PATH
    });
    expect(allow.allowAllCors).toBe(true);

    const deny = createServerEnv({
      NODE_ENV: "production",
      CORS_ORIGINS: "https://docs.example.com",
      ALLOW_ALL_CORS: "0",
      COLLAB_SESSION_SECRET: "test-secret",
      STATE_FILE_PATH: PROD_STATE_FILE_PATH
    });
    expect(deny.allowAllCors).toBe(false);
  });

  it("유효한 PORT와 편집 키는 trim 후 반영한다", () => {
    const env = createServerEnv({
      PORT: "4500",
      EDITOR_ACCESS_KEY: "  editor-key  "
    });

    expect(env.port).toBe(4500);
    expect(env.editorAccessKey).toBe("editor-key");
  });
});
