import { expect, test } from "@playwright/test";

test.describe("생성 플로우", () => {
  test("문서를 생성하고 문서 방으로 진입한다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "실시간 협업 문서 서비스" })).toBeVisible();

    await page.getByPlaceholder("문서 제목").fill("E2E 테스트 문서");
    await page.getByRole("button", { name: "새 문서 만들기" }).click();

    await expect(page).toHaveURL(/\/docs\/[^/]+$/);
    await expect(page.getByRole("link", { name: "문서 목록으로" })).toBeVisible();
    await expect(page.getByPlaceholder("문서 제목")).toBeVisible();
  });

  test("보드를 생성하고 보드 방으로 진입한다", async ({ page }) => {
    await page.goto("http://127.0.0.1:3000/whiteboard");
    await expect(page.getByRole("heading", { name: "실시간 화이트보드 협업" })).toBeVisible();

    await page.getByPlaceholder("보드 제목").fill("E2E 테스트 보드");
    await page.getByRole("button", { name: "새 보드 만들기" }).click();

    await expect(page).toHaveURL(/\/whiteboard\/[^/]+$/);
    await expect(page.getByRole("link", { name: "보드 목록" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
  });
});
