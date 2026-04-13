import { expect, test, type APIRequestContext } from "@playwright/test";

const serverUrl = "http://127.0.0.1:4000";
const docsUrl = "http://127.0.0.1:3000";
const whiteboardUrl = "http://127.0.0.1:3000/whiteboard";

const uniqueName = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createProtectedDocument = async (
  request: APIRequestContext,
  title: string,
  editorAccessKey: string
): Promise<string> => {
  const response = await request.post(`${serverUrl}/api/documents`, {
    data: {
      title,
      actor: "E2E 권한 검증 사용자",
      editorAccessKey
    }
  });

  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { document: { id: string } };
  return payload.document.id;
};

const createProtectedBoard = async (
  request: APIRequestContext,
  title: string,
  editorAccessKey: string
): Promise<string> => {
  const response = await request.post(`${serverUrl}/api/boards`, {
    data: {
      title,
      actor: "E2E 권한 검증 사용자",
      editorAccessKey
    }
  });

  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { board: { id: string } };
  return payload.board.id;
};

test.describe("권한 및 보호 키 플로우", () => {
  test("문서에서 editor 요청 실패 시 viewer로 강등되고 올바른 키로 복구된다", async ({ page, request }) => {
    const editorAccessKey = "docs-correct-key";
    const documentId = await createProtectedDocument(request, uniqueName("문서-권한-복구"), editorAccessKey);

    await page.goto(docsUrl);
    await page.evaluate(() => {
      localStorage.setItem("reserver7.displayName", "E2E 권한 사용자");
      localStorage.setItem("reserver7.document.role", "editor");
      localStorage.setItem("reserver7.document.editorAccessKey", "wrong-key");
    });

    await page.goto(`${docsUrl}/docs/${documentId}`);

    const roleBadge = page.getByTestId("document-current-role");
    const editorKeyInput = page.getByTestId("document-editor-access-key-input");
    const contentTextarea = page.getByPlaceholder("여기서부터 실시간 협업이 시작됩니다...");

    await expect(roleBadge).toHaveText("권한: viewer", { timeout: 15_000 });
    await expect(page.getByText(/보기 전용\(`viewer`\) 세션입니다\./)).toBeVisible();
    await expect(contentTextarea).not.toBeEditable();
    await expect(editorKeyInput).toHaveValue("");

    await editorKeyInput.fill(editorAccessKey);
    await page
      .getByTestId("document-requested-role-select")
      .getByRole("button", { name: /viewer|editor/i })
      .click();
    await page.getByRole("option", { name: "editor (편집 가능)" }).click();

    await expect(roleBadge).toHaveText("권한: editor", { timeout: 15_000 });
    await expect(contentTextarea).toBeEditable();
  });

  test("화이트보드에서 editor 요청 실패 시 viewer로 강등되고 올바른 키로 복구된다", async ({
    page,
    request
  }) => {
    const editorAccessKey = "board-correct-key";
    const boardId = await createProtectedBoard(request, uniqueName("보드-권한-복구"), editorAccessKey);

    await page.goto(whiteboardUrl);
    await page.evaluate(() => {
      localStorage.setItem("reserver7.board.displayName", "E2E 보드 사용자");
      localStorage.setItem("reserver7.board.role", "editor");
      localStorage.setItem("reserver7.board.editorAccessKey", "wrong-key");
    });

    await page.goto(`${whiteboardUrl}/${boardId}`);

    const roleBadge = page.getByTestId("board-current-role");
    const addShapeButton = page.getByRole("button", { name: "도형 추가" });
    const editorKeyInput = page.getByTestId("board-editor-access-key-input");

    await expect(roleBadge).toHaveText("권한: viewer", { timeout: 15_000 });
    await expect(page.getByText(/보기 전용\(`viewer`\) 세션입니다\./)).toBeVisible();
    await expect(addShapeButton).toBeDisabled();
    await expect(editorKeyInput).toHaveValue("");

    await editorKeyInput.fill(editorAccessKey);
    await page
      .getByTestId("board-requested-role-select")
      .getByRole("button", { name: /viewer|editor/i })
      .click();
    await page.getByRole("option", { name: "editor (편집 가능)" }).click();

    await expect(roleBadge).toHaveText("권한: editor", { timeout: 15_000 });
    await expect(addShapeButton).toBeEnabled();
  });

  test("문서 삭제는 보호 키 검증 실패를 표시하고 올바른 키 입력 후 삭제된다", async ({ page, request }) => {
    const editorAccessKey = "docs-delete-key";
    const title = uniqueName("문서-삭제-보호");
    const documentId = await createProtectedDocument(request, title, editorAccessKey);

    await page.goto(docsUrl);

    const targetCard = page.getByTestId(`document-card-${documentId}`);
    const deleteButton = page.getByTestId(`document-delete-${documentId}`);

    await expect(targetCard).toBeVisible();
    await deleteButton.click();

    const deleteDialog = page.getByRole("dialog", { name: "문서를 삭제할까요?" });
    const deleteKeyInput = page.getByPlaceholder("삭제 비밀번호");
    await deleteKeyInput.fill("wrong-delete-key");
    await deleteDialog.getByRole("button", { name: "문서 삭제" }).click();

    await expect(deleteDialog.getByText("문서 삭제 비밀번호가 올바르지 않습니다.")).toBeVisible();
    await expect(deleteKeyInput).toHaveValue("");

    await deleteKeyInput.fill(editorAccessKey);
    await deleteDialog.getByRole("button", { name: "문서 삭제" }).click();

    await expect(targetCard).toHaveCount(0);
  });

  test("화이트보드 삭제는 보호 키 검증 실패를 표시하고 올바른 키 입력 후 삭제된다", async ({
    page,
    request
  }) => {
    const editorAccessKey = "board-delete-key";
    const title = uniqueName("보드-삭제-보호");
    const boardId = await createProtectedBoard(request, title, editorAccessKey);

    await page.goto(whiteboardUrl);

    const targetCard = page.getByTestId(`board-card-${boardId}`);
    const deleteButton = page.getByTestId(`board-delete-${boardId}`);

    await expect(targetCard).toBeVisible();
    await deleteButton.click();

    const deleteDialog = page.getByRole("dialog", { name: "화이트보드를 삭제할까요?" });
    const deleteKeyInput = page.getByPlaceholder("삭제 비밀번호");
    await deleteKeyInput.fill("wrong-delete-key");
    await deleteDialog.getByRole("button", { name: "화이트보드 삭제" }).click();

    await expect(deleteDialog.getByText("화이트보드 삭제 비밀번호가 올바르지 않습니다.")).toBeVisible();
    await expect(deleteKeyInput).toHaveValue("");

    await deleteKeyInput.fill(editorAccessKey);
    await deleteDialog.getByRole("button", { name: "화이트보드 삭제" }).click();

    await expect(targetCard).toHaveCount(0);
  });
});
