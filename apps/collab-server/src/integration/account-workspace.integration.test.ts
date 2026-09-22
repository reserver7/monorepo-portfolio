import { createHmac } from "node:crypto";
import { io as createSocketClient } from "socket.io-client";
import { startTestServerProcess, type TestServerProcess } from "../test/server-process";

const secret = "bridge-integration-secret";

const accountToken = (id: string): string => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "HS256", typ: "OPS-BRIDGE" })}.${encode({
    id,
    email: `${id}@example.com`,
    name: id,
    role: "viewer",
    type: "session",
    exp: Math.floor(Date.now() / 1000) + 3600
  })}`;
  return `${unsigned}.${createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
};

describe("계정별 작업 공간 API", () => {
  let runtime: TestServerProcess;

  beforeAll(async () => {
    runtime = await startTestServerProcess({ env: { AUTH_BRIDGE_SECRET: secret } });
  });

  afterAll(async () => runtime.stop());

  it("인증 없는 목록 조회를 거부한다", async () => {
    const response = await fetch(`${runtime.baseUrl}/api/documents`);
    expect(response.status).toBe(401);
  });

  it("생성한 문서는 해당 계정 목록에만 나타난다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("account-a")}` };
    const bob = { Authorization: `Bearer ${accountToken("account-b")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "계정 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string; ownerId?: string } };
    expect(createdResponse.status).toBe(201);
    expect(created.document.ownerId).toBe("account-a");

    const bobList = await fetch(`${runtime.baseUrl}/api/documents`, { headers: bob });
    const bobPayload = (await bobList.json()) as { documents: Array<{ id: string }> };
    expect(bobPayload.documents.some((document) => document.id === created.document.id)).toBe(false);
  });

  it("개인 문서 상세 접근은 멤버 초대 후에만 허용한다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("account-a")}` };
    const bob = { Authorization: `Bearer ${accountToken("account-b")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "비공개 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };

    const denied = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}`, { headers: bob });
    expect(denied.status).toBe(403);

    const invited = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "account-b@example.com", role: "viewer" })
    });
    expect(invited.status).toBe(201);

    const allowed = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}`, { headers: bob });
    expect(allowed.status).toBe(200);

    const bobList = await fetch(`${runtime.baseUrl}/api/documents`, { headers: bob });
    const bobPayload = (await bobList.json()) as { documents: Array<{ id: string }> };
    expect(bobPayload.documents.some((document) => document.id === created.document.id)).toBe(true);
  });

  it("viewer 멤버는 실시간 방에서 편집 권한을 얻지 못한다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("account-a")}` };
    const bob = { Authorization: `Bearer ${accountToken("account-b")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "실시간 권한 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "account-b@example.com", role: "viewer" })
    });

    const tokenResponse = await fetch(`${runtime.baseUrl}/api/session/realtime-token`, {
      method: "POST",
      headers: bob
    });
    const { token } = (await tokenResponse.json()) as { token: string };
    const socket = createSocketClient(runtime.baseUrl, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: false
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("socket timeout")), 5000);
        socket.once("connect", () => {
          socket.emit("document:join", {
            documentId: created.document.id,
            accountToken: token,
            role: "editor"
          });
        });
        socket.once("document:state", (payload: { role: string }) => {
          clearTimeout(timeout);
          expect(payload.role).toBe("viewer");
          resolve();
        });
        socket.once("connect_error", reject);
      });
    } finally {
      socket.disconnect();
    }
  });
});
