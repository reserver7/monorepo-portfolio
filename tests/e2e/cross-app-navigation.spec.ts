import { expect, test } from "@playwright/test";

test.describe("앱 간 이동", () => {
  test("문서 홈에서 화이트보드로 이동할 수 있다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "실시간 협업 문서 서비스" })).toBeVisible();

    await page.getByRole("button", { name: "화이트보드로 이동" }).click();

    await expect(page).toHaveURL(/127\.0\.0\.1:3001\/?$/);
    await expect(page.getByRole("heading", { name: "실시간 화이트보드 협업" })).toBeVisible();
  });

  test("화이트보드 홈에서 문서로 이동할 수 있다", async ({ page }) => {
    await page.goto("http://127.0.0.1:3001");
    await expect(page.getByRole("heading", { name: "실시간 화이트보드 협업" })).toBeVisible();

    await page.getByRole("button", { name: "문서로 이동" }).click();

    await expect(page).toHaveURL(/127\.0\.0\.1:3000\/?$/);
    await expect(page.getByRole("heading", { name: "실시간 협업 문서 서비스" })).toBeVisible();
  });
});
