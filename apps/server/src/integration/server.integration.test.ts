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

const fetchJson = async (
  url: string,
  options?: {
    method?: "GET" | "POST" | "DELETE";
    body?: JsonRecord;
    headers?: Record<string, string>;
  }
): Promise<{ status: number; data: JsonRecord }> => {
  const response = await fetch(url, {
    method: options?.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options?.headers ?? {})
    },
    body: options?.body ? JSON.stringify(options.body) : undefined
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

describe("서버 통합 시나리오", () => {
  let runtime: TestServerProcess | null = null;

  beforeAll(async () => {
    runtime = await startTestServerProcess();
  });

  afterAll(async () => {
    if (runtime) {
      await runtime.stop();
    }
  });

  it("REST 댓글 API는 세션 토큰을 발급하고 재사용 시 trusted=true를 반환한다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }
    const documentId = await getFirstDocumentId(runtime.baseUrl);

    const first = await fetchJson(`${runtime.baseUrl}/api/documents/${documentId}/comments`, {
      method: "POST",
      body: {
        authorName: "테스터",
        body: "첫 번째 댓글"
      }
    });

    expect(first.status).toBe(201);
    const firstSession = first.data.session as
      | { id: string; token: string; trusted: boolean }
      | undefined;
    expect(firstSession?.id).toBeTruthy();
    expect(firstSession?.token).toBeTruthy();
    expect(firstSession?.trusted).toBe(false);

    if (!firstSession) {
      throw new Error("세션 응답이 없습니다.");
    }

    const second = await fetchJson(`${runtime.baseUrl}/api/documents/${documentId}/comments`, {
      method: "POST",
      headers: {
        "x-collab-session-id": firstSession.id,
        "x-collab-session-token": firstSession.token
      },
      body: {
        authorName: "테스터",
        body: "두 번째 댓글"
      }
    });

    expect(second.status).toBe(201);
    const secondSession = second.data.session as
      | { id: string; token: string; trusted: boolean }
      | undefined;
    expect(secondSession?.id).toBe(firstSession.id);
    expect(secondSession?.trusted).toBe(true);
  });

  it("문서 입장에서 편집 키가 없으면 editor 요청이 viewer로 강등된다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }
    const documentId = await getFirstDocumentId(runtime.baseUrl);
    const socket = await connectSocket(runtime.baseUrl);

    try {
      const statePromise = waitForSocketEvent<{
        role: "viewer" | "editor";
      }>(socket, "document:state");
      const deniedPromise = waitForSocketEvent<{
        scope: "document" | "board";
        currentRole: "viewer" | "editor";
      }>(
        socket,
        "permission:denied",
        (payload) => payload.scope === "document"
      );

      socket.emit("document:join", {
        documentId,
        displayName: "권한테스트",
        role: "editor"
      });

      const state = await statePromise;
      const denied = await deniedPromise;
      expect(state.role).toBe("viewer");
      expect(denied.currentRole).toBe("viewer");
    } finally {
      socket.disconnect();
    }
  });

  it("같은 세션이 viewer로 잠겨도 올바른 키로 재입장하면 editor로 승급된다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }

    const documentId = await getFirstDocumentId(runtime.baseUrl);
    const viewerSocket = await connectSocket(runtime.baseUrl);
    const editorSocket = await connectSocket(runtime.baseUrl);

    try {
      const viewerStatePromise = waitForSocketEvent<{
        role: "viewer" | "editor";
        sessionId?: string;
        sessionToken?: string;
      }>(viewerSocket, "document:state");

      viewerSocket.emit("document:join", {
        documentId,
        displayName: "viewer-lock",
        role: "editor"
      });

      const viewerState = await viewerStatePromise;
      expect(viewerState.role).toBe("viewer");
      expect(typeof viewerState.sessionId).toBe("string");
      expect(typeof viewerState.sessionToken).toBe("string");

      const editorStatePromise = waitForSocketEvent<{ role: "viewer" | "editor" }>(
        editorSocket,
        "document:state"
      );
      editorSocket.emit("document:join", {
        documentId,
        sessionId: viewerState.sessionId,
        sessionToken: viewerState.sessionToken,
        displayName: "editor-upgrade",
        role: "editor",
        editorAccessKey: "integration-editor-key"
      });

      const editorState = await editorStatePromise;
      expect(editorState.role).toBe("editor");
    } finally {
      viewerSocket.disconnect();
      editorSocket.disconnect();
    }
  });

  it("문서 업데이트 payload가 제한을 넘으면 에러를 반환한다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }
    const documentId = await getFirstDocumentId(runtime.baseUrl);
    const socket = await connectSocket(runtime.baseUrl);

    try {
      const state = waitForSocketEvent<{ role: "viewer" | "editor" }>(socket, "document:state");
      socket.emit("document:join", {
        documentId,
        displayName: "payload-tester",
        role: "editor",
        editorAccessKey: "integration-editor-key"
      });
      const joined = await state;
      expect(joined.role).toBe("editor");

      const errorPromise = waitForSocketEvent<{ message: string }>(
        socket,
        "error",
        (payload) => payload.message.includes("요청 본문이 허용 크기를 초과했습니다.")
      );

      socket.emit("document:update", {
        documentId,
        title: "payload-limit-test",
        content: "x".repeat(500)
      });

      const error = await errorPromise;
      expect(error.message).toContain("요청 본문이 허용 크기를 초과했습니다.");
    } finally {
      socket.disconnect();
    }
  });

  it("문서 Yjs 업데이트 payload가 제한을 넘으면 에러를 반환한다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }
    const documentId = await getFirstDocumentId(runtime.baseUrl);
    const socket = await connectSocket(runtime.baseUrl);

    try {
      const state = waitForSocketEvent<{ role: "viewer" | "editor" }>(socket, "document:state");
      socket.emit("document:join", {
        documentId,
        displayName: "yjs-limit-tester",
        role: "editor",
        editorAccessKey: "integration-editor-key"
      });
      const joined = await state;
      expect(joined.role).toBe("editor");

      const errorPromise = waitForSocketEvent<{ message: string }>(
        socket,
        "error",
        (payload) => payload.message.includes("문서 업데이트 데이터가 허용 크기를 초과했습니다.")
      );

      socket.emit("document:yjs:update", {
        documentId,
        encodedUpdate: "A".repeat(1000)
      });

      const error = await errorPromise;
      expect(error.message).toContain("문서 업데이트 데이터가 허용 크기를 초과했습니다.");
    } finally {
      socket.disconnect();
    }
  });

  it("동일 이벤트 연속 호출 시 rate limit을 초과하면 차단한다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }
    const documentId = await getFirstDocumentId(runtime.baseUrl);
    const socket = await connectSocket(runtime.baseUrl);

    try {
      const state = waitForSocketEvent<{ role: "viewer" | "editor" }>(socket, "document:state");
      socket.emit("document:join", {
        documentId,
        displayName: "rate-limit",
        role: "editor",
        editorAccessKey: "integration-editor-key"
      });
      const joined = await state;
      expect(joined.role).toBe("editor");

      const rateLimitErrorPromise = waitForSocketEvent<{ message: string }>(
        socket,
        "error",
        (payload) => payload.message.includes("요청이 너무 많습니다")
      );

      socket.emit("document:save", { documentId });
      socket.emit("document:save", { documentId });
      socket.emit("document:save", { documentId });

      const error = await rateLimitErrorPromise;
      expect(error.message).toContain("요청이 너무 많습니다");
    } finally {
      socket.disconnect();
    }
  });

  it("보드 입장도 편집 키 정책을 동일하게 적용한다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }
    const boardId = await getFirstBoardId(runtime.baseUrl);

    const viewerSocket = await connectSocket(runtime.baseUrl);
    const editorSocket = await connectSocket(runtime.baseUrl);

    try {
      const viewerStatePromise = waitForSocketEvent<{ role: "viewer" | "editor" }>(
        viewerSocket,
        "board:state"
      );
      const viewerDeniedPromise = waitForSocketEvent<{ scope: "document" | "board" }>(
        viewerSocket,
        "permission:denied",
        (payload) => payload.scope === "board"
      );

      viewerSocket.emit("board:join", {
        boardId,
        displayName: "viewer",
        role: "editor"
      });

      const viewerState = await viewerStatePromise;
      await viewerDeniedPromise;
      expect(viewerState.role).toBe("viewer");

      const editorStatePromise = waitForSocketEvent<{ role: "viewer" | "editor" }>(
        editorSocket,
        "board:state"
      );
      editorSocket.emit("board:join", {
        boardId,
        displayName: "editor",
        role: "editor",
        editorAccessKey: "integration-editor-key"
      });

      const editorState = await editorStatePromise;
      expect(editorState.role).toBe("editor");
    } finally {
      viewerSocket.disconnect();
      editorSocket.disconnect();
    }
  });

  it("문서 삭제는 항목별 편집 키를 검증한다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }

    const created = await fetchJson(`${runtime.baseUrl}/api/documents`, {
      method: "POST",
      body: {
        title: "삭제 보호 문서",
        actor: "tester",
        editorAccessKey: "doc-delete-key"
      }
    });
    expect(created.status).toBe(201);

    const document = created.data.document as { id: string } | undefined;
    if (!document?.id) {
      throw new Error("생성된 문서 ID를 확인할 수 없습니다.");
    }

    const forbiddenDelete = await fetchJson(`${runtime.baseUrl}/api/documents/${document.id}`, {
      method: "DELETE",
      body: {
        editorAccessKey: "wrong-key"
      }
    });
    expect(forbiddenDelete.status).toBe(403);

    const allowedDelete = await fetchJson(`${runtime.baseUrl}/api/documents/${document.id}`, {
      method: "DELETE",
      body: {
        editorAccessKey: "doc-delete-key"
      }
    });
    expect(allowedDelete.status).toBe(200);

    const afterDelete = await fetchJson(`${runtime.baseUrl}/api/documents/${document.id}`);
    expect(afterDelete.status).toBe(404);
  });

  it("화이트보드 삭제는 항목별 편집 키를 검증한다", async () => {
    if (!runtime) {
      throw new Error("테스트 서버가 시작되지 않았습니다.");
    }

    const created = await fetchJson(`${runtime.baseUrl}/api/boards`, {
      method: "POST",
      body: {
        title: "삭제 보호 보드",
        actor: "tester",
        editorAccessKey: "board-delete-key"
      }
    });
    expect(created.status).toBe(201);

    const board = created.data.board as { id: string } | undefined;
    if (!board?.id) {
      throw new Error("생성된 보드 ID를 확인할 수 없습니다.");
    }

    const forbiddenDelete = await fetchJson(`${runtime.baseUrl}/api/boards/${board.id}`, {
      method: "DELETE",
      body: {
        editorAccessKey: "wrong-key"
      }
    });
    expect(forbiddenDelete.status).toBe(403);

    const allowedDelete = await fetchJson(`${runtime.baseUrl}/api/boards/${board.id}`, {
      method: "DELETE",
      body: {
        editorAccessKey: "board-delete-key"
      }
    });
    expect(allowedDelete.status).toBe(200);

    const afterDelete = await fetchJson(`${runtime.baseUrl}/api/boards/${board.id}`);
    expect(afterDelete.status).toBe(404);
  });
});
