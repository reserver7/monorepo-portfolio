import { expect, test } from "@playwright/test";

const opslensUrl = "http://127.0.0.1:3002";

test.describe("OpsLens 로그 분석 플로우", () => {
  test("로그 분석 실행 시 결과 카드가 표시되고 성공 토스트가 1회만 노출된다", async ({ page }) => {
    await page.goto(`${opslensUrl}/logs`);

    await page.getByRole("button", { name: "샘플 넣기" }).click();
    await page.getByRole("button", { name: "로그 분석 실행" }).click();

    await expect(page.getByText("로그 분석이 완료되었습니다.")).toHaveCount(1);
    await expect(page.getByText("분석 결과 클러스터")).toBeVisible();
    await expect(page.getByText("신규 이슈 생성")).toBeVisible();
  });

  test("상단 검색어는 URL 쿼리와 동기화된다", async ({ page }) => {
    await page.goto(`${opslensUrl}/logs`);

    const searchInput = page.getByPlaceholder("서비스, 이슈, 로그 검색");
    await searchInput.fill("payment timeout");
    await searchInput.press("Enter");

    await expect(page).toHaveURL(/[?&]q=payment\+timeout|[?&]q=payment%20timeout/);
  });
});
