import { createHmac } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const serverUrl = `http://127.0.0.1:${process.env.PLAYWRIGHT_SERVER_PORT ?? "4010"}`;
const bridgeSecret = "e2e-bridge-secret";

const accountToken = (id: string): string => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "HS256", typ: "OPS-BRIDGE" })}.${encode({
    id,
    email: `${id}@example.com`,
    name: id,
    role: "operator",
    type: "session",
    exp: Math.floor(Date.now() / 1000) + 3600
  })}`;
  return `${unsigned}.${createHmac("sha256", bridgeSecret).update(unsigned).digest("base64url")}`;
};

const authenticate = async (page: Page, token: string) => {
  await page.context().addCookies([{ name: "collab.auth", value: token, domain: "127.0.0.1", path: "/" }]);
};

const uniqueName = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createDocument = async (request: APIRequestContext, title: string, token: string): Promise<void> => {
  const response = await request.post(`${serverUrl}/api/documents`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { title, actor: "워크스페이스 E2E" }
  });
  expect(response.ok()).toBeTruthy();
};

test.describe("워크스페이스 대시보드", () => {
  test("URL 필터를 복원하고 커맨드 팔레트를 연다", async ({ page, request }) => {
    const title = uniqueName("URL-문서");
    const token = accountToken(uniqueName("workspace-url"));
    await request.post(`${serverUrl}/api/documents`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title, actor: "워크스페이스 E2E" }
    });
    await authenticate(page, token);

    await page.goto(`/workspace?q=${encodeURIComponent(title)}&kind=document&sort=name`);
    await expect(page.locator("#workspace-search")).toHaveValue(title);
    await expect(page.getByRole("link", { name: `문서: ${title}` })).toBeVisible();

    await page.keyboard.press("/");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("textbox")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("카드에서 키보드로 즐겨찾기를 전환한다", async ({ page, request }) => {
    const title = uniqueName("키보드-문서");
    const token = accountToken(uniqueName("workspace-keyboard"));
    await createDocument(request, title, token);
    await authenticate(page, token);

    await page.goto(`/workspace?q=${encodeURIComponent(title)}`);
    const cardLink = page.getByRole("link", { name: `문서: ${title}` });
    await cardLink.focus();
    await page.keyboard.press("f");

    await expect(page.getByRole("button", { name: "고정 해제" })).toBeVisible();
  });

  test("대시보드에서 문서를 생성하고 문서 화면으로 이동한다", async ({ page }) => {
    const title = uniqueName("대시보드-생성");
    await authenticate(page, accountToken(uniqueName("workspace-create-page")));
    await page.goto("/workspace");
    await page.locator("#workspace-create-document").fill(title);
    await page.getByRole("button", { name: "문서 만들기" }).click();

    await expect(page).toHaveURL(/\/docs\/[^/]+$/);
  });
});

test.describe("모바일 워크스페이스 대시보드", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("카드 액션 메뉴가 화면 안에 표시된다", async ({ page, request }) => {
    const title = uniqueName("모바일-문서");
    const token = accountToken(uniqueName("workspace-mobile"));
    await createDocument(request, title, token);
    await authenticate(page, token);

    await page.goto(`/workspace?q=${encodeURIComponent(title)}`);
    const menu = page.getByRole("button", { name: `${title} 작업 메뉴` });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });

  test("모바일에서도 빠른 검색을 열고 입력에 포커스한다", async ({ page }) => {
    const token = accountToken(uniqueName("workspace-mobile-search"));
    await authenticate(page, token);
    await page.goto("/workspace");

    await page.keyboard.press("/");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("textbox")).toBeFocused();
  });
});

test("권한별 대시보드 액션이 정책에 맞게 표시된다", async ({ browser, request }) => {
  const title = uniqueName("권한-문서");
  const ownerToken = accountToken(uniqueName("workspace-owner"));
  const editorToken = accountToken(uniqueName("workspace-editor"));
  const viewerToken = accountToken(uniqueName("workspace-viewer"));
  const editorEmail = `${JSON.parse(Buffer.from(editorToken.split(".")[1], "base64url")).email}`;
  const viewerEmail = `${JSON.parse(Buffer.from(viewerToken.split(".")[1], "base64url")).email}`;

  const createResponse = await request.post(`${serverUrl}/api/documents`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: { title, actor: "권한 E2E" }
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as { document: { id: string } };

  for (const [email, role] of [
    [editorEmail, "editor"],
    [viewerEmail, "viewer"]
  ] as const) {
    const inviteResponse = await request.post(`${serverUrl}/api/documents/${created.document.id}/members`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { email, role }
    });
    expect(inviteResponse.status()).toBe(201);
  }

  for (const [token, email] of [
    [editorToken, editorEmail],
    [viewerToken, viewerEmail]
  ] as const) {
    const acceptResponse = await request.post(
      `${serverUrl}/api/documents/${created.document.id}/members/respond`,
      { headers: { Authorization: `Bearer ${token}` }, data: { status: "accepted" } }
    );
    expect(acceptResponse.status()).toBe(200);
    expect(email).toContain("@example.com");
  }

  const openAs = async (token: string) => {
    const context = await browser.newContext();
    await context.addCookies([{ name: "collab.auth", value: token, domain: "127.0.0.1", path: "/" }]);
    const page = await context.newPage();
    await page.goto(`/workspace?q=${encodeURIComponent(title)}`);
    await expect(page.getByRole("link", { name: `문서: ${title}` })).toBeVisible();
    return { context, page };
  };

  const owner = await openAs(ownerToken);
  await owner.page.getByRole("button", { name: `${title} 작업 메뉴` }).click();
  await expect(owner.page.getByRole("menuitem", { name: "이름 변경" })).toBeVisible();
  await expect(owner.page.getByRole("menuitem", { name: "공유 관리" })).toBeVisible();
  await expect(owner.page.getByRole("menuitem", { name: "삭제" })).toBeVisible();
  await owner.context.close();

  const editor = await openAs(editorToken);
  await editor.page.getByRole("button", { name: `${title} 작업 메뉴` }).click();
  await expect(editor.page.getByRole("menuitem", { name: "이름 변경" })).toBeVisible();
  await expect(editor.page.getByRole("menuitem", { name: "복제" })).toBeVisible();
  await expect(editor.page.getByRole("menuitem", { name: "공유 정보" })).toBeVisible();
  await expect(editor.page.getByRole("menuitem", { name: "삭제" })).not.toBeVisible();
  await editor.context.close();

  const viewer = await openAs(viewerToken);
  await viewer.page.getByRole("button", { name: `${title} 작업 메뉴` }).click();
  await expect(viewer.page.getByRole("menuitem", { name: "공유 정보" })).toBeVisible();
  await expect(viewer.page.getByRole("menuitem", { name: "이름 변경" })).not.toBeVisible();
  await expect(viewer.page.getByRole("menuitem", { name: "삭제" })).not.toBeVisible();
  await viewer.context.close();
});

test("소유자는 삭제를 실행 취소할 수 있다", async ({ page, request }) => {
  const title = uniqueName("삭제-복구-문서");
  const token = accountToken(uniqueName("workspace-delete"));
  await createDocument(request, title, token);
  await authenticate(page, token);

  await page.goto(`/workspace?q=${encodeURIComponent(title)}`);
  await page.getByRole("button", { name: `${title} 작업 메뉴` }).click();
  await page.getByRole("menuitem", { name: "삭제" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "휴지통으로 이동" }).click();

  await expect(page.getByText(`“${title}”을(를) 휴지통으로 이동했습니다.`)).toBeVisible();
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(page.getByRole("link", { name: `문서: ${title}` })).toBeVisible();
});

test("공유 멤버는 나가기 확인 후 대시보드에서 제거된다", async ({ page, request }) => {
  const title = uniqueName("나가기-문서");
  const ownerToken = accountToken(uniqueName("workspace-leave-owner"));
  const viewerToken = accountToken(uniqueName("workspace-leave-viewer"));
  const viewerPayload = JSON.parse(Buffer.from(viewerToken.split(".")[1], "base64url")) as { email: string };

  const createResponse = await request.post(`${serverUrl}/api/documents`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: { title, actor: "나가기 E2E" }
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as { document: { id: string } };
  const inviteResponse = await request.post(`${serverUrl}/api/documents/${created.document.id}/members`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: { email: viewerPayload.email, role: "viewer" }
  });
  expect(inviteResponse.status()).toBe(201);
  const acceptResponse = await request.post(
    `${serverUrl}/api/documents/${created.document.id}/members/respond`,
    { headers: { Authorization: `Bearer ${viewerToken}` }, data: { status: "accepted" } }
  );
  expect(acceptResponse.status()).toBe(200);

  await authenticate(page, viewerToken);
  await page.goto(`/workspace?q=${encodeURIComponent(title)}`);
  await page.getByRole("button", { name: `${title} 작업 메뉴` }).click();
  await page.getByRole("menuitem", { name: "공유 정보" }).click();
  await expect(page.getByRole("heading", { name: "공유 및 권한" })).toBeVisible();
  await page.getByRole("button", { name: "이 작업 공간에서 나가기" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "나가기" }).click();

  await expect(page.getByRole("link", { name: `문서: ${title}` })).not.toBeVisible();
});
