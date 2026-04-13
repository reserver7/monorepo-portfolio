import { defineConfig } from "@playwright/test";

const editorAccessKey = "integration-editor-key";
const serverUrl = "http://127.0.0.1:4000";
const collabWebUrl = "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 35_000,
  expect: {
    timeout: 5_000
  },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: collabWebUrl,
    trace: process.env.CI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
    video: "off"
  },
  webServer: [
    {
      command: "pnpm --filter @repo/collab-server exec tsx src/index.ts",
      url: `${serverUrl}/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: "4000",
        STATE_FILE_PATH: "/tmp/monorepo-portfolio-e2e-state.json",
        CORS_ORIGINS:
          "http://127.0.0.1:3000,http://localhost:3000",
        COLLAB_SESSION_SECRET: "e2e-collab-session-secret",
        EDITOR_ACCESS_KEY: editorAccessKey,
        SOCKET_RATE_LIMIT_WINDOW_MS: "10000",
        SOCKET_WRITE_EVENTS_PER_WINDOW: "120",
        SOCKET_CURSOR_EVENTS_PER_WINDOW: "300",
        MAX_YJS_UPDATE_BASE64_CHARS: "300000",
        MAX_SOCKET_JSON_CHARS: "80000"
      }
    },
    {
      command: "pnpm --filter @repo/collab-web dev",
      url: collabWebUrl,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_API_URL: serverUrl,
        NEXT_PUBLIC_APP_URL: collabWebUrl,
        NEXT_PUBLIC_DEFAULT_DOC_ROLE: "editor",
        NEXT_PUBLIC_DEFAULT_BOARD_ROLE: "editor",
        NEXT_PUBLIC_EDITOR_ACCESS_KEY: editorAccessKey
      }
    }
  ]
});
