import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { WhiteboardShape } from "@repo/shared-types";
import { RealtimeStore } from "./store";

const now = "2026-03-20T00:00:00.000Z";

describe("실시간 스토어", () => {
  let tempDir = "";
  let stateFilePath = "";
  let store: RealtimeStore;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "realtime-store-test-"));
    stateFilePath = path.join(tempDir, "state.json");
    store = new RealtimeStore(stateFilePath);
    await store.init();
    await store.persistNow();
  });

  afterEach(async () => {
    if (store) {
      await store.persistNow();
    }
    await rm(tempDir, { recursive: true, force: true });
  });

  it("댓글 작성자 권한을 강제하고 멘션을 정규화한다", () => {
    const seededDocument = store.listDocuments()[0];
    expect(seededDocument).toBeDefined();
    if (!seededDocument) {
      return;
    }

    const added = store.addDocumentComment({
      documentId: seededDocument.id,
      authorSessionId: "session-a",
      authorName: "Alice",
      body: "   Hello    team   ",
      mentions: [" @alice ", "alice", "@@bob", "", " @bob "]
    });

    expect(added).not.toBeNull();
    if (!added) {
      return;
    }

    expect(added.body).toBe("Hello team");
    expect(added.mentions).toEqual(["alice", "bob"]);

    const forbiddenUpdate = store.updateDocumentComment({
      documentId: seededDocument.id,
      commentId: added.id,
      authorSessionId: "session-b",
      body: "hijacked",
      mentions: []
    });
    expect(forbiddenUpdate).toBe("forbidden");

    const allowedUpdate = store.updateDocumentComment({
      documentId: seededDocument.id,
      commentId: added.id,
      authorSessionId: "session-a",
      body: "  Updated   message ",
      mentions: ["@qa-team"]
    });

    expect(allowedUpdate).not.toBeNull();
    expect(allowedUpdate).not.toBe("forbidden");
    if (!allowedUpdate || allowedUpdate === "forbidden") {
      return;
    }

    expect(allowedUpdate.body).toBe("Updated message");
    expect(allowedUpdate.mentions).toEqual(["qa-team"]);

    const forbiddenDelete = store.deleteDocumentComment({
      documentId: seededDocument.id,
      commentId: added.id,
      authorSessionId: "session-b"
    });
    expect(forbiddenDelete).toBe("forbidden");

    const allowedDelete = store.deleteDocumentComment({
      documentId: seededDocument.id,
      commentId: added.id,
      authorSessionId: "session-a"
    });
    expect(allowedDelete).toBe(added.id);
  });

  it("참조 도형 삭제 시 연결선도 함께 제거한다", () => {
    const seededBoard = store.listBoards()[0];
    expect(seededBoard).toBeDefined();
    if (!seededBoard) {
      return;
    }

    const rectA: WhiteboardShape = {
      id: "shape-a",
      type: "rect",
      x: 100,
      y: 100,
      w: 120,
      h: 80,
      fill: "#bfdbfe",
      stroke: "#2563eb",
      createdBy: "alice",
      updatedAt: now
    };

    const rectB: WhiteboardShape = {
      id: "shape-b",
      type: "rect",
      x: 360,
      y: 120,
      w: 120,
      h: 80,
      fill: "#dcfce7",
      stroke: "#16a34a",
      createdBy: "alice",
      updatedAt: now
    };

    const connector: WhiteboardShape = {
      id: "connector-a-b",
      type: "connector",
      x: 220,
      y: 140,
      w: 140,
      h: 20,
      fromShapeId: "shape-a",
      toShapeId: "shape-b",
      startX: 220,
      startY: 140,
      endX: 360,
      endY: 160,
      fill: "transparent",
      stroke: "#334155",
      createdBy: "alice",
      updatedAt: now
    };

    expect(
      store.addBoardShape({
        boardId: seededBoard.id,
        shape: rectA,
        actor: "alice"
      })?.changed
    ).toBe(true);
    expect(
      store.addBoardShape({
        boardId: seededBoard.id,
        shape: rectB,
        actor: "alice"
      })?.changed
    ).toBe(true);
    expect(
      store.addBoardShape({
        boardId: seededBoard.id,
        shape: connector,
        actor: "alice"
      })?.changed
    ).toBe(true);

    const removed = store.removeBoardShape({
      boardId: seededBoard.id,
      shapeId: rectA.id,
      actor: "alice"
    });

    expect(removed?.changed).toBe(true);
    if (!removed) {
      return;
    }

    const remainingShapeIds = removed.board.shapes.map((shape) => shape.id);
    expect(remainingShapeIds).not.toContain("shape-a");
    expect(remainingShapeIds).toContain("shape-b");
    expect(remainingShapeIds).not.toContain("connector-a-b");
  });

  it("요청 시 상태 파일을 정상적으로 기록한다", async () => {
    await store.persistNow();

    const raw = await readFile(stateFilePath, "utf8");
    const parsed = JSON.parse(raw) as {
      documents: unknown[];
      boards: unknown[];
    };

    expect(Array.isArray(parsed.documents)).toBe(true);
    expect(Array.isArray(parsed.boards)).toBe(true);
    expect(parsed.documents.length).toBeGreaterThan(0);
    expect(parsed.boards.length).toBeGreaterThan(0);
  });

  it("댓글 최대 개수(240)를 넘으면 오래된 댓글부터 정리한다", () => {
    const seededDocument = store.listDocuments()[0];
    expect(seededDocument).toBeDefined();
    if (!seededDocument) {
      return;
    }

    for (let index = 0; index < 260; index += 1) {
      const comment = store.addDocumentComment({
        documentId: seededDocument.id,
        authorSessionId: "session-load-test",
        authorName: "부하테스트",
        body: `comment-${index}`,
        mentions: []
      });
      expect(comment).not.toBeNull();
    }

    const comments = store.listDocumentComments(seededDocument.id);
    expect(comments).toHaveLength(240);
    expect(comments[0]?.body).toBe("comment-259");
    expect(comments.at(-1)?.body).toBe("comment-20");
  });

  it("문서 히스토리는 최대 160개까지만 유지한다", () => {
    const seededDocument = store.listDocuments()[0];
    expect(seededDocument).toBeDefined();
    if (!seededDocument) {
      return;
    }

    for (let index = 0; index < 220; index += 1) {
      const result = store.updateDocument({
        documentId: seededDocument.id,
        title: `title-${index}`,
        actor: "history-test"
      });
      expect(result).not.toBeNull();
      expect(result?.changed).toBe(true);
    }

    const history = store.getHistory(seededDocument.id);
    expect(history).toHaveLength(160);
  });

  it("낙관적 버전이 오래되면 conflict 플래그를 반환한다", () => {
    const seededDocument = store.listDocuments()[0];
    expect(seededDocument).toBeDefined();
    if (!seededDocument) {
      return;
    }

    const first = store.updateDocument({
      documentId: seededDocument.id,
      title: "v2",
      actor: "tester",
      baseVersion: 1
    });
    expect(first).not.toBeNull();
    expect(first?.conflict).toBe(false);

    const conflict = store.updateDocument({
      documentId: seededDocument.id,
      content: "stale-write",
      actor: "tester",
      baseVersion: 1
    });

    expect(conflict).not.toBeNull();
    expect(conflict?.changed).toBe(true);
    expect(conflict?.conflict).toBe(true);
  });

  it("유효하지 않은 Yjs 업데이트는 무시한다", () => {
    const seededDocument = store.listDocuments()[0];
    expect(seededDocument).toBeDefined();
    if (!seededDocument) {
      return;
    }

    const result = store.mergeDocumentYjsUpdate({
      documentId: seededDocument.id,
      encodedUpdate: "not-valid-yjs-update",
      actor: "tester"
    });

    expect(result).not.toBeNull();
    expect(result?.changed).toBe(false);
  });

  it("문서 삭제는 문서별 편집 키를 검증한다", () => {
    const protectedDocument = store.createDocument("보호 문서", "tester", "1234");
    const unprotectedDocument = store.createDocument("일반 문서", "tester");

    const forbiddenDelete = store.deleteDocument({
      documentId: protectedDocument.id,
      editorAccessKey: "9999"
    });
    expect(forbiddenDelete).toBe("forbidden");

    const allowedDelete = store.deleteDocument({
      documentId: protectedDocument.id,
      editorAccessKey: "1234"
    });
    expect(allowedDelete).toEqual({ documentId: protectedDocument.id });
    expect(store.getDocument(protectedDocument.id)).toBeNull();

    const unprotectedDelete = store.deleteDocument({
      documentId: unprotectedDocument.id
    });
    expect(unprotectedDelete).toEqual({ documentId: unprotectedDocument.id });
    expect(store.getDocument(unprotectedDocument.id)).toBeNull();
  });

  it("화이트보드 삭제는 보드별 편집 키를 검증한다", () => {
    const protectedBoard = store.createBoard("보호 보드", "tester", "abcd");
    const unprotectedBoard = store.createBoard("일반 보드", "tester");

    const forbiddenDelete = store.deleteBoard({
      boardId: protectedBoard.id,
      editorAccessKey: "wrong"
    });
    expect(forbiddenDelete).toBe("forbidden");

    const allowedDelete = store.deleteBoard({
      boardId: protectedBoard.id,
      editorAccessKey: "abcd"
    });
    expect(allowedDelete).toEqual({ boardId: protectedBoard.id });
    expect(store.getBoard(protectedBoard.id)).toBeNull();

    const unprotectedDelete = store.deleteBoard({
      boardId: unprotectedBoard.id
    });
    expect(unprotectedDelete).toEqual({ boardId: unprotectedBoard.id });
    expect(store.getBoard(unprotectedBoard.id)).toBeNull();
  });

  it("상태 파일에는 편집 키를 평문으로 저장하지 않는다", async () => {
    const protectedDocument = store.createDocument("해시 검증 문서", "tester", "doc-secret");
    const protectedBoard = store.createBoard("해시 검증 보드", "tester", "board-secret");

    await store.persistNow();

    const raw = await readFile(stateFilePath, "utf8");
    const parsed = JSON.parse(raw) as {
      documentAccessKeys?: Record<string, string>;
      boardAccessKeys?: Record<string, string>;
    };

    const storedDocumentKey = parsed.documentAccessKeys?.[protectedDocument.id];
    const storedBoardKey = parsed.boardAccessKeys?.[protectedBoard.id];

    expect(storedDocumentKey).toBeDefined();
    expect(storedDocumentKey).not.toBe("doc-secret");
    expect(storedDocumentKey?.startsWith("ek1$")).toBe(true);

    expect(storedBoardKey).toBeDefined();
    expect(storedBoardKey).not.toBe("board-secret");
    expect(storedBoardKey?.startsWith("ek1$")).toBe(true);
  });

  it("보드 undo 스택은 최대 120단계까지만 되돌릴 수 있다", () => {
    const created = store.createBoard("undo-stack-test", "tester");
    const rect: WhiteboardShape = {
      id: "undo-shape",
      type: "rect",
      x: 10,
      y: 10,
      w: 80,
      h: 50,
      fill: "#bfdbfe",
      stroke: "#2563eb",
      createdBy: "tester",
      updatedAt: now
    };

    const added = store.addBoardShape({
      boardId: created.id,
      shape: rect,
      actor: "tester"
    });
    expect(added?.changed).toBe(true);

    for (let index = 0; index < 140; index += 1) {
      const patched = store.patchBoardShape({
        boardId: created.id,
        shapeId: rect.id,
        patch: {
          x: 10 + index
        },
        actor: "tester"
      });
      expect(patched?.changed).toBe(true);
    }

    let effectiveUndoCount = 0;
    let previousVersion = store.getBoard(created.id)?.version ?? 0;

    for (let index = 0; index < 180; index += 1) {
      const undone = store.undoBoard(created.id);
      expect(undone).not.toBeNull();
      if (!undone) {
        continue;
      }

      if (undone.version > previousVersion) {
        effectiveUndoCount += 1;
        previousVersion = undone.version;
      }
    }

    expect(effectiveUndoCount).toBe(120);
  });
});
