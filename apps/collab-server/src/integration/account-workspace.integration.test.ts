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

  it("즐겨찾기는 계정별로 저장하고 서로 격리한다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("favorite-account-a")}` };
    const bob = { Authorization: `Bearer ${accountToken("favorite-account-b")}` };
    const saved = await fetch(`${runtime.baseUrl}/api/workspace/favorites`, {
      method: "PATCH",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ favoriteKeys: ["document:one", "document:one", "board:two"] })
    });
    expect(saved.status).toBe(200);
    expect((await saved.json()).favoriteKeys).toEqual(["document:one", "board:two"]);

    const aliceFavorites = await fetch(`${runtime.baseUrl}/api/workspace/favorites`, { headers: alice });
    expect((await aliceFavorites.json()).favoriteKeys).toEqual(["document:one", "board:two"]);
    const bobFavorites = await fetch(`${runtime.baseUrl}/api/workspace/favorites`, { headers: bob });
    expect((await bobFavorites.json()).favoriteKeys).toEqual([]);
  });

  it("편집자는 작업 공간을 복제할 수 있고 뷰어는 복제할 수 없다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("duplicate-owner")}` };
    const bob = { Authorization: `Bearer ${accountToken("duplicate-viewer")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "복제 원본" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };

    const duplicate = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/duplicate`, {
      method: "POST",
      headers: alice
    });
    expect(duplicate.status).toBe(201);
    expect((await duplicate.json()).document).toMatchObject({
      title: "복제 원본 복사본",
      ownerId: "duplicate-owner"
    });

    const denied = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/duplicate`, {
      method: "POST",
      headers: bob
    });
    expect(denied.status).toBe(403);
  });

  it("편집자는 문서 이력을 복원할 수 있다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("restore-owner")}` };
    const bob = { Authorization: `Bearer ${accountToken("restore-viewer")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "복원 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };
    const historyResponse = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/history`, {
      headers: alice
    });
    const history = (await historyResponse.json()) as { history: Array<{ id: string; content?: string }> };
    const snapshot = history.history.find((entry) => entry.content !== undefined);
    expect(snapshot).toBeDefined();

    const restored = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/restore`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ historyId: snapshot?.id })
    });
    expect(restored.status).toBe(200);

    const denied = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/restore`, {
      method: "POST",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({ historyId: snapshot?.id })
    });
    expect(denied.status).toBe(403);
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

  it("소유자는 문서와 화이트보드 이름을 변경하고 빈 이름은 거부한다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("rename-owner")}` };
    const bob = { Authorization: `Bearer ${accountToken("rename-other")}` };
    const jsonHeaders = { ...alice, "content-type": "application/json" };
    const documentResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ title: "기존 문서" })
    });
    const document = (await documentResponse.json()) as { document: { id: string } };
    const boardResponse = await fetch(`${runtime.baseUrl}/api/boards`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ title: "기존 보드" })
    });
    const board = (await boardResponse.json()) as { board: { id: string } };

    const renamedDocument = await fetch(`${runtime.baseUrl}/api/documents/${document.document.id}`, {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({ title: "새 문서" })
    });
    expect(renamedDocument.status).toBe(200);
    expect((await renamedDocument.json()).document.title).toBe("새 문서");

    const renamedBoard = await fetch(`${runtime.baseUrl}/api/boards/${board.board.id}`, {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({ title: "새 보드" })
    });
    expect(renamedBoard.status).toBe(200);
    expect((await renamedBoard.json()).board.title).toBe("새 보드");

    const blank = await fetch(`${runtime.baseUrl}/api/documents/${document.document.id}`, {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({ title: "  " })
    });
    expect(blank.status).toBe(400);

    const denied = await fetch(`${runtime.baseUrl}/api/boards/${board.board.id}`, {
      method: "PATCH",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({ title: "권한 없음" })
    });
    expect(denied.status).toBe(403);
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

    const pending = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}`, { headers: bob });
    expect(pending.status).toBe(403);

    const accepted = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members/respond`, {
      method: "POST",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({ status: "accepted" })
    });
    expect(accepted.status).toBe(200);

    const allowed = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}`, { headers: bob });
    expect(allowed.status).toBe(200);

    const bobList = await fetch(`${runtime.baseUrl}/api/documents`, { headers: bob });
    const bobPayload = (await bobList.json()) as { documents: Array<{ id: string }> };
    expect(bobPayload.documents.some((document) => document.id === created.document.id)).toBe(true);
  });

  it("소유자는 승인된 멤버의 역할을 변경할 수 있다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("account-a")}` };
    const bob = { Authorization: `Bearer ${accountToken("account-b")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "역할 변경 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "account-b@example.com", role: "viewer" })
    });
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members/respond`, {
      method: "POST",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({ status: "accepted" })
    });
    const changed = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "PATCH",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "account-b@example.com", role: "editor" })
    });
    expect(changed.status).toBe(200);
    expect((await changed.json()).member).toMatchObject({
      email: "account-b@example.com",
      role: "editor",
      status: "accepted"
    });

    const denied = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "PATCH",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({ email: "account-b@example.com", role: "viewer" })
    });
    expect(denied.status).toBe(403);
  });

  it("소유자만 멤버 활동 로그를 조회할 수 있다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("account-a")}` };
    const bob = { Authorization: `Bearer ${accountToken("account-b")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "활동 로그 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "account-b@example.com", role: "viewer" })
    });

    const activity = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/activity`, {
      headers: alice
    });
    expect(activity.status).toBe(200);
    expect((await activity.json()).activities).toMatchObject([
      { action: "invited", memberEmail: "account-b@example.com", actorId: "account-a" }
    ]);

    const denied = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/activity`, {
      headers: bob
    });
    expect(denied.status).toBe(403);
  });

  it("멤버 변경 알림은 대상 계정만 읽고 읽음 처리할 수 있다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("notify-owner")}` };
    const bob = { Authorization: `Bearer ${accountToken("notify-member")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "알림 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "notify-member@example.com", role: "viewer" })
    });
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members/respond`, {
      method: "POST",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({ status: "accepted" })
    });
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "PATCH",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "notify-member@example.com", role: "editor" })
    });

    const notifications = await fetch(`${runtime.baseUrl}/api/notifications`, { headers: bob });
    expect(notifications.status).toBe(200);
    const payload = (await notifications.json()) as {
      unreadCount: number;
      notifications: Array<{ id: string; action: string }>;
    };
    expect(payload.unreadCount).toBe(1);
    expect(payload.notifications).toMatchObject([{ action: "role-changed" }]);

    const marked = await fetch(`${runtime.baseUrl}/api/notifications/${payload.notifications[0]!.id}/read`, {
      method: "PATCH",
      headers: bob
    });
    expect(marked.status).toBe(200);
    const after = await fetch(`${runtime.baseUrl}/api/notifications`, { headers: bob });
    expect((await after.json()).unreadCount).toBe(0);

    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "PATCH",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "notify-member@example.com", role: "viewer" })
    });
    const markedAll = await fetch(`${runtime.baseUrl}/api/notifications/read-all`, {
      method: "PATCH",
      headers: bob
    });
    expect(markedAll.status).toBe(200);
    expect((await markedAll.json()).marked).toBe(1);
  });

  it("댓글 멘션은 멘션된 계정의 알림 센터에 표시된다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("mention-owner")}` };
    const bob = { Authorization: `Bearer ${accountToken("mention-member")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "멘션 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "mention-member@example.com", role: "viewer" })
    });
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members/respond`, {
      method: "POST",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({ status: "accepted" })
    });

    const comment = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/comments`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ body: "@mention-member 확인 부탁드립니다", mentions: ["mention-member"] })
    });
    expect(comment.status).toBe(201);
    const commentPayload = (await comment.json()) as { comment: { id: string } };

    const notifications = await fetch(`${runtime.baseUrl}/api/notifications`, { headers: bob });
    expect(notifications.status).toBe(200);
    expect((await notifications.json()).notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "mentioned",
          entityId: created.document.id,
          commentId: commentPayload.comment.id
        })
      ])
    );

    const reply = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/comments`, {
      method: "POST",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({
        body: "원댓글에 답글입니다",
        parentCommentId: commentPayload.comment.id
      })
    });
    expect(reply.status).toBe(201);
    const replyPayload = (await reply.json()) as { comment: { id: string } };
    const ownerNotifications = await fetch(`${runtime.baseUrl}/api/notifications`, { headers: alice });
    expect((await ownerNotifications.json()).notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "replied", commentId: replyPayload.comment.id })
      ])
    );
  });

  it("소유자는 승인된 멤버에게 소유권을 이전할 수 있다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("account-a")}` };
    const bob = { Authorization: `Bearer ${accountToken("account-b")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "소유권 이전 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "account-b@example.com", role: "editor" })
    });
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members/respond`, {
      method: "POST",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({ status: "accepted" })
    });

    const transferred = await fetch(
      `${runtime.baseUrl}/api/documents/${created.document.id}/members/transfer-ownership`,
      {
        method: "POST",
        headers: { ...alice, "content-type": "application/json" },
        body: JSON.stringify({ email: "account-b@example.com" })
      }
    );
    expect(transferred.status).toBe(200);

    const oldOwner = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}`, {
      headers: alice
    });
    expect(oldOwner.status).toBe(200);
    expect((await oldOwner.json()).permission).toBe("editor");
    const newOwner = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}`, { headers: bob });
    expect(newOwner.status).toBe(200);
    expect((await newOwner.json()).permission).toBe("owner");
  });

  it("승인된 멤버는 스스로 나갈 수 있고 소유자는 나갈 수 없다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("account-a")}` };
    const bob = { Authorization: `Bearer ${accountToken("account-b")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "멤버 탈퇴 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "account-b@example.com", role: "viewer" })
    });
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members/respond`, {
      method: "POST",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({ status: "accepted" })
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
    const statePromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("socket state timeout")), 5000);
      socket.once("document:state", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    const revokedPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("access revoke timeout")), 5000);
      socket.once("workspace:access-revoked", (payload: { scope: string }) => {
        clearTimeout(timeout);
        expect(payload.scope).toBe("document");
        resolve();
      });
    });
    socket.once("connect", () => {
      socket.emit("document:join", {
        documentId: created.document.id,
        accountToken: token,
        role: "viewer"
      });
    });
    await statePromise;

    try {
      const left = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members/self`, {
        method: "DELETE",
        headers: bob
      });
      expect(left.status).toBe(200);
      expect((await left.json()).member).toMatchObject({ email: "account-b@example.com" });
      await revokedPromise;
    } finally {
      socket.disconnect();
    }

    const denied = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}`, { headers: bob });
    expect(denied.status).toBe(403);

    const ownerLeave = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members/self`, {
      method: "DELETE",
      headers: alice
    });
    expect(ownerLeave.status).toBe(403);
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
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members/respond`, {
      method: "POST",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({ status: "accepted" })
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

  it("역할을 낮추면 접속 중인 편집자도 즉시 읽기 전용이 된다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("account-a")}` };
    const bob = { Authorization: `Bearer ${accountToken("account-b")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "실시간 역할 변경 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ email: "account-b@example.com", role: "editor" })
    });
    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members/respond`, {
      method: "POST",
      headers: { ...bob, "content-type": "application/json" },
      body: JSON.stringify({ status: "accepted" })
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
    const statePromise = new Promise<{ role: string }>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("socket state timeout")), 5000);
      socket.once("document:state", (payload: { role: string }) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });
    const permissionPromise = new Promise<{ currentRole: string }>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("permission update timeout")), 5000);
      socket.once("permission:update", (payload: { currentRole: string }) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    try {
      socket.once("connect", () => {
        socket.emit("document:join", {
          documentId: created.document.id,
          accountToken: token,
          role: "editor"
        });
      });
      await expect(statePromise).resolves.toMatchObject({ role: "editor" });

      const changed = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
        method: "PATCH",
        headers: { ...alice, "content-type": "application/json" },
        body: JSON.stringify({ email: "account-b@example.com", role: "viewer" })
      });
      expect(changed.status).toBe(200);
      await expect(permissionPromise).resolves.toMatchObject({ currentRole: "viewer" });

      const restoredPermission = new Promise<{ currentRole: string }>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("permission restore timeout")), 5000);
        socket.once("permission:update", (payload: { currentRole: string }) => {
          clearTimeout(timeout);
          resolve(payload);
        });
      });
      const restored = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/members`, {
        method: "PATCH",
        headers: { ...alice, "content-type": "application/json" },
        body: JSON.stringify({ email: "account-b@example.com", role: "editor" })
      });
      expect(restored.status).toBe(200);
      await expect(restoredPermission).resolves.toMatchObject({ currentRole: "editor" });
    } finally {
      socket.disconnect();
    }
  });

  it("소유자는 삭제한 작업 공간을 휴지통에서 복구하고 영구 삭제한다", async () => {
    const alice = { Authorization: `Bearer ${accountToken("account-trash")}` };
    const createdResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { ...alice, "content-type": "application/json" },
      body: JSON.stringify({ title: "휴지통 문서" })
    });
    const created = (await createdResponse.json()) as { document: { id: string } };
    expect(createdResponse.status).toBe(201);

    const deleted = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}`, {
      method: "DELETE",
      headers: alice
    });
    expect(deleted.status).toBe(200);

    const trash = await fetch(`${runtime.baseUrl}/api/workspace/trash`, { headers: alice });
    const trashPayload = (await trash.json()) as { documents: Array<{ id: string }> };
    expect(trash.status).toBe(200);
    expect(trashPayload.documents.map((item) => item.id)).toContain(created.document.id);

    const restored = await fetch(
      `${runtime.baseUrl}/api/workspace/trash/document/${created.document.id}/restore`,
      { method: "POST", headers: alice }
    );
    expect(restored.status).toBe(200);
    expect(
      (await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}`, { headers: alice })).status
    ).toBe(200);

    await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}`, {
      method: "DELETE",
      headers: alice
    });
    const permanentlyDeleted = await fetch(
      `${runtime.baseUrl}/api/workspace/trash/document/${created.document.id}`,
      { method: "DELETE", headers: alice }
    );
    expect(permanentlyDeleted.status).toBe(200);
    expect(
      (await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}`, { headers: alice })).status
    ).toBe(404);
  });
});
