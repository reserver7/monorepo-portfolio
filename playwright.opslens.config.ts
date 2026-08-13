import { devices, defineConfig } from "@playwright/test";

const opslensUrl = process.env.OPSLENS_E2E_BASE_URL ?? "http://127.0.0.1:3002";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /opslens-.*\.spec\.ts/,
  timeout: 35_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-opslens" }]],
  use: {
    baseURL: opslensUrl,
    trace: process.env.CI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
    video: "off"
  },
  projects: [
    { name: "desktop-chromium", use: { browserName: "chromium" } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } }
  ],
  webServer: [
    {
      command: "pnpm --filter @repo/opslens-server dev",
      url: "http://127.0.0.1:4100/health",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: "4100",
        DATABASE_URL: "postgresql://portfolio:portfolio-local-password@127.0.0.1:5433/opslens?schema=public",
        DIRECT_DATABASE_URL: "postgresql://portfolio:portfolio-local-password@127.0.0.1:5433/opslens?schema=public",
        AUTH_JWT_SECRET: "opslens-e2e-jwt-secret",
        AUTH_BRIDGE_SECRET: "opslens-e2e-bridge-secret",
        CORS_ORIGINS: opslensUrl
      }
    },
    {
      command: "pnpm --filter @repo/opslens-web exec next start -p 3002",
      url: `${opslensUrl}/login`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:4100/graphql",
        NEXT_PUBLIC_APP_URL: opslensUrl,
        NEXTAUTH_SECRET: "opslens-e2e-nextauth-secret",
        NEXTAUTH_URL: opslensUrl,
        OPSLENS_AUTH_BRIDGE_SECRET: "opslens-e2e-bridge-secret"
      }
    }
  ]
});
