import { expect, test } from "./opslens-test";

const opslensUrl = process.env.OPSLENS_E2E_BASE_URL ?? "http://127.0.0.1:3002";

test.describe("OpsLens 서비스 상세", () => {
  test("서비스 상세 경로가 서비스 운영 지표 또는 오류 상태를 명확히 표시한다", async ({ page }) => {
    await page.goto(`${opslensUrl}/services/checkout`);

    await expect(page.getByText("checkout 서비스 운영").or(page.getByText("서비스 운영 데이터를 불러오지 못했습니다."))).toBeVisible();
  });

  test("모바일에서도 서비스 상태와 대응 진입점을 제공한다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${opslensUrl}/services/checkout`);

    await expect(
      page.getByText("checkout 서비스 운영").or(page.getByText("서비스 운영 데이터를 불러오지 못했습니다."))
    ).toBeVisible();
  });
});
