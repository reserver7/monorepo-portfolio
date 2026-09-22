import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

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

test("소유자는 공유 패널을 보고 viewer는 편집 권한을 받지 못한다", async ({ browser, request }) => {
  const ownerToken = accountToken("owner-e2e");
  const viewerToken = accountToken("viewer-e2e");
  const createdResponse = await request.post(`${serverUrl}/api/documents`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: { title: "공유 E2E 문서" }
  });
  expect(createdResponse.status()).toBe(201);
  const created = (await createdResponse.json()) as { document: { id: string } };

  const inviteResponse = await request.post(`${serverUrl}/api/documents/${created.document.id}/members`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: { email: "viewer-e2e@example.com", role: "viewer" }
  });
  expect(inviteResponse.status()).toBe(201);

  const acceptResponse = await request.post(
    `${serverUrl}/api/documents/${created.document.id}/members/respond`,
    {
      headers: { Authorization: `Bearer ${viewerToken}` },
      data: { status: "accepted" }
    }
  );
  expect(acceptResponse.status()).toBe(200);

  const ownerContext = await browser.newContext();
  await ownerContext.addCookies([{ name: "collab.auth", value: ownerToken, domain: "127.0.0.1", path: "/" }]);
  const ownerPage = await ownerContext.newPage();
  await ownerPage.goto(`/docs/${created.document.id}`);
  await expect(ownerPage.getByRole("heading", { name: "공유 및 권한" })).toBeVisible();
  await ownerContext.close();

  const viewerContext = await browser.newContext();
  await viewerContext.addCookies([
    { name: "collab.auth", value: viewerToken, domain: "127.0.0.1", path: "/" }
  ]);
  const viewerPage = await viewerContext.newPage();
  await viewerPage.goto(`/docs/${created.document.id}`);
  await expect(viewerPage.getByTestId("document-current-role")).toContainText("viewer");
  await expect(viewerPage.getByRole("heading", { name: "공유 및 권한" })).not.toBeVisible();
  await viewerContext.close();
});
