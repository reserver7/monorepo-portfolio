import { expect, test, type APIRequestContext } from "@playwright/test";

const serverUrl = "http://127.0.0.1:4000";
const docsUrl = "http://127.0.0.1:3000";
const whiteboardUrl = "http://127.0.0.1:3001";

const uniqueName = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createDocument = async (request: APIRequestContext, title: string): Promise<string> => {
  const response = await request.post(`${serverUrl}/api/documents`, {
    data: {
      title,
      actor: "E2E UI 상태 검증"
    }
  });

  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { document: { id: string } };
  return payload.document.id;
};

const createBoard = async (request: APIRequestContext, title: string): Promise<string> => {
  const response = await request.post(`${serverUrl}/api/boards`, {
    data: {
      title,
      actor: "E2E UI 상태 검증"
    }
  });

  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { board: { id: string } };
  return payload.board.id;
};

test.describe("UI 상태 동기화", () => {
  test("문서 방 입장 후 목록 복귀 시 홈 편집 키 입력값이 초기화된다", async ({ page, request }) => {
    const documentId = await createDocument(request, uniqueName("문서-키-초기화"));

    await page.goto(docsUrl);
    const homeEditorKeyInput = page.locator('input[title="편집 키"]').first();
    await homeEditorKeyInput.fill("임시-편집-키");

    const targetCard = page.getByTestId(`document-card-${documentId}`);
    await expect(targetCard).toBeVisible();
    await targetCard.getByRole("button", { name: "문서 입장" }).click();
    await expect(page).toHaveURL(new RegExp(`/doc/${documentId}$`));

    await page.getByRole("link", { name: "문서 목록으로" }).click();
    await expect(page).toHaveURL(`${docsUrl}/`);

    await expect(homeEditorKeyInput).toHaveValue("");
  });

  test("화이트보드 방 입장 후 목록 복귀 시 홈 편집 키 입력값이 초기화된다", async ({ page, request }) => {
    const boardId = await createBoard(request, uniqueName("보드-키-초기화"));

    await page.goto(whiteboardUrl);
    const homeEditorKeyInput = page.locator('input[title="편집 키"]').first();
    await homeEditorKeyInput.fill("임시-보드-키");

    const targetCard = page.getByTestId(`board-card-${boardId}`);
    await expect(targetCard).toBeVisible();
    await targetCard.getByRole("button", { name: "보드 입장" }).click();
    await expect(page).toHaveURL(new RegExp(`/board/${boardId}$`));

    await page.getByRole("link", { name: "보드 목록" }).click();
    await expect(page).toHaveURL(`${whiteboardUrl}/`);

    await expect(homeEditorKeyInput).toHaveValue("");
  });

  test("다크/라이트 모드가 문서에서 화이트보드로 이동해도 유지된다", async ({ page }) => {
    const isDarkMode = async (): Promise<boolean> => {
      return page.locator("html").evaluate((element) => element.classList.contains("dark"));
    };

    await page.goto(docsUrl);

    const toggleButton = page.getByRole("button", { name: /모드로 전환/ });
    const currentLabel = await toggleButton.getAttribute("aria-label");
    if (currentLabel === "다크 모드로 전환") {
      await toggleButton.click();
    }

    await expect
      .poll(async () => {
        return isDarkMode();
      })
      .toBe(true);

    await page.getByRole("button", { name: "화이트보드로 이동" }).click();
    await expect
      .poll(async () => {
        const current = new URL(page.url());
        return `${current.origin}${current.pathname}`;
      })
      .toBe(`${whiteboardUrl}/`);
    await expect
      .poll(async () => {
        return isDarkMode();
      })
      .toBe(true);
  });
});
