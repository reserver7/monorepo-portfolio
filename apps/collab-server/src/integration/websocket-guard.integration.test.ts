import { createHmac } from "node:crypto";
import type { Socket } from "socket.io-client";
import { io as createSocketClient } from "socket.io-client";
import { startTestServerProcess, type TestServerProcess } from "../test/server-process";

jest.setTimeout(60_000);

type JsonRecord = Record<string, unknown>;

const waitForSocketEvent = <T>(
  socket: Socket,
  eventName: string,
  predicate?: (payload: T) => boolean,
  timeoutMs = 8000
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(eventName, onEvent);
      reject(new Error(`이벤트 대기 시간 초과: ${eventName}`));
    }, timeoutMs);

    const onEvent = (payload: T) => {
      if (predicate && !predicate(payload)) {
        return;
      }
      clearTimeout(timeout);
      socket.off(eventName, onEvent);
      resolve(payload);
    };

    socket.on(eventName, onEvent);
  });
};

const connectSocket = async (baseUrl: string): Promise<Socket> => {
  const socket = createSocketClient(baseUrl, {
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
    timeout: 7000
  });

  await waitForSocketEvent(socket, "connect");
  return socket;
};

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
  return `${unsigned}.${createHmac("sha256", "activity-integration-secret").update(unsigned).digest("base64url")}`;
};

const fetchJson = async (url: string): Promise<{ status: number; data: JsonRecord }> => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accountToken("socket-guard")}`
    }
  });

  const data = (await response.json()) as JsonRecord;
  return { status: response.status, data };
};

const getFirstDocumentId = async (baseUrl: string): Promise<string> => {
  const { status, data } = await fetchJson(`${baseUrl}/api/documents`);
  expect(status).toBe(200);

  const documents = data.documents as Array<{ id: string }> | undefined;
  expect(documents?.length).toBeGreaterThan(0);

  const first = documents?.[0];
  if (!first?.id) {
    throw new Error("문서 시드 데이터가 없습니다.");
  }
  return first.id;
};

const getFirstBoardId = async (baseUrl: string): Promise<string> => {
  const { status, data } = await fetchJson(`${baseUrl}/api/boards`);
  expect(status).toBe(200);

  const boards = data.boards as Array<{ id: string }> | undefined;
  expect(boards?.length).toBeGreaterThan(0);

  const first = boards?.[0];
  if (!first?.id) {
    throw new Error("보드 시드 데이터가 없습니다.");
  }
  return first.id;
};

describe("WebSocket payload/rate 보호", () => {
  let runtime: TestServerProcess | null = null;

  beforeAll(async () => {
    runtime = await startTestServerProcess({ env: { AUTH_BRIDGE_SECRET: "activity-integration-secret" } });
  });

  afterAll(async () => {
    if (runtime) {
      await runtime.stop();
    }
  });

  it("board:shape:remove payload가 제한을 넘으면 차단한다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }

    const boardId = await getFirstBoardId(runtime.baseUrl);
    const socket = await connectSocket(runtime.baseUrl);

    try {
      const statePromise = waitForSocketEvent<{ role: "viewer" | "editor" }>(socket, "board:state");
      socket.emit("board:join", {
        boardId,
        displayName: "payload-guard",
        role: "editor",
        editorAccessKey: "integration-editor-key"
      });

      const state = await statePromise;
      expect(state.role).toBe("editor");

      const errorPromise = waitForSocketEvent<{ message: string }>(socket, "error", (payload) =>
        payload.message.includes("요청 본문이 허용 크기를 초과했습니다.")
      );

      socket.emit("board:shape:remove", {
        boardId,
        shapeId: "shape-id",
        padding: "x".repeat(500)
      });

      const error = await errorPromise;
      expect(error.message).toContain("요청 본문이 허용 크기를 초과했습니다.");
    } finally {
      socket.disconnect();
    }
  });

  it("cursor:move 이벤트는 cursor rate limit을 초과하면 차단한다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }

    const documentId = await getFirstDocumentId(runtime.baseUrl);
    const socket = await connectSocket(runtime.baseUrl);

    try {
      const statePromise = waitForSocketEvent<{ role: "viewer" | "editor" }>(socket, "document:state");
      socket.emit("document:join", {
        documentId,
        displayName: "cursor-rate-limit",
        role: "viewer"
      });

      await statePromise;

      const errorPromise = waitForSocketEvent<{ message: string }>(socket, "error", (payload) =>
        payload.message.includes("요청이 너무 많습니다")
      );

      for (let index = 0; index < 5; index += 1) {
        socket.emit("cursor:move", {
          documentId,
          cursorIndex: index
        });
      }

      const error = await errorPromise;
      expect(error.message).toContain("요청이 너무 많습니다");
    } finally {
      socket.disconnect();
    }
  });

  it("멤버십 변경은 현재 workspace room에 활동 갱신 이벤트를 보낸다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }

    const owner = accountToken("activity-owner");
    const created = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${owner}`, "content-type": "application/json" },
      body: JSON.stringify({ title: "실시간 활동 문서" })
    });
    const createdPayload = (await created.json()) as { document?: { id: string } };
    const documentId = createdPayload.document?.id;
    if (!documentId) throw new Error("문서가 생성되지 않았습니다.");
    const realtimeTokenResponse = await fetch(`${runtime.baseUrl}/api/session/realtime-token`, {
      method: "POST",
      headers: { Authorization: `Bearer ${owner}` }
    });
    const realtimeToken = ((await realtimeTokenResponse.json()) as { token?: string }).token;
    if (!realtimeToken) throw new Error("realtime token이 발급되지 않았습니다.");

    const socket = await connectSocket(runtime.baseUrl);
    try {
      socket.emit("activity:subscribe", {
        scope: "document",
        entityId: documentId,
        accountToken: realtimeToken
      });

      const activityPromise = waitForSocketEvent<{ scope: string; entityId: string }>(
        socket,
        "activity:update"
      );
      const invited = await fetch(`${runtime.baseUrl}/api/documents/${documentId}/members`, {
        method: "POST",
        headers: { Authorization: `Bearer ${owner}`, "content-type": "application/json" },
        body: JSON.stringify({ email: "activity-member@example.com", role: "viewer" })
      });
      expect(invited.status).toBe(201);

      await expect(activityPromise).resolves.toEqual({ scope: "document", entityId: documentId });
    } finally {
      socket.disconnect();
    }
  });
});
