import { expect, test } from "./opslens-test";

const locales = ["ko", "en", "ja"] as const;
const opslensUrl = process.env.OPSLENS_E2E_BASE_URL ?? "http://127.0.0.1:3002";
const dashboardError = {
  ko: "대시보드 조회에 실패했습니다.",
  en: "Failed to load dashboard.",
  ja: "ダッシュボードの取得に失敗しました。"
} as const;
const ogLocale = { ko: "ko_KR", en: "en_US", ja: "ja_JP" } as const;

test.describe("OpsLens locale smoke", () => {
  for (const locale of locales) {
    test(`${locale} keeps the locale contract across core routes`, async ({ page }) => {
      await page.context().addCookies([
        {
          name: "opslens-locale",
          value: locale,
          url: opslensUrl
        }
      ]);
      await page.setViewportSize({ width: 390, height: 844 });

      for (const route of ["/", "/issues", "/logs", "/deployments", "/settings"]) {
        await page.goto(`${opslensUrl}${route}`);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
        await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", ogLocale[locale]);
        await expect(page.locator("body")).not.toContainText("__TODO_TRANSLATE__");
      }
    });

    test(`${locale} renders a localized API error state`, async ({ page }) => {
      await page.context().addCookies([{ name: "opslens-locale", value: locale, url: opslensUrl }]);
      await page.route("**/graphql*", (route) => route.abort());
      await page.goto(opslensUrl);
      await expect(page.getByText(dashboardError[locale])).toBeVisible();
    });

    test(`${locale} exposes a loading state while the API is pending`, async ({ page }) => {
      await page.context().addCookies([{ name: "opslens-locale", value: locale, url: opslensUrl }]);
      await page.route("**/graphql*", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.abort();
      });
      await page.goto(opslensUrl, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".animate-pulse").first()).toBeVisible();
    });
  }
});
