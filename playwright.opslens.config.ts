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
  ]
});
