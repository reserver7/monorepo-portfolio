"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { RhfField, useAppForm } from "@repo/forms";
import { useQuery } from "@repo/react-query";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StateView,
  PRIMITIVE_COLOR_PALETTE,
  useDisclosure
} from "@repo/ui";
import { getBoard, whiteboardQueryKeys } from "@/lib/http";
import { useWhiteboardRealtime } from "@/features/board/hooks/use-whiteboard-realtime";
import { useWhiteboardStore } from "@/features/board/stores/use-whiteboard-store";
import { WhiteboardShape } from "@/lib/collab";
import {
  createGuestName,
  getStoredDisplayName,
  getStoredEditorAccessKey,
  getStoredRole,
  setStoredDisplayName,
  setStoredEditorAccessKey,
  setStoredRole
} from "@/lib/collab";
import { formatExactTime, formatRelativeTime } from "@/lib/collab";
import { collabFieldCopy } from "@repo/utils/collab";
import {
  ConnectorHandle,
  findNearestNodeCenter,
  makeConnector,
  makeShape,
  NodeShapeType,
  resizeHandleStyle,
  resolveConnectorEndpoints,
  ResizeHandle,
  shapePreset,
  WhiteboardTool
} from "@/features/board/components/shape-utils";

const BoardSidePanel = dynamic(
  () => import("@/features/board/components/board-side-panel").then((mod) => mod.BoardSidePanel),
  { ssr: false }
);

const connectionLabel = {
  connecting: "연결 중",
  online: "온라인",
  offline: "오프라인"
} as const;

const toolLabel: Record<WhiteboardTool, string> = {
  select: "선택/이동",
  rect: "사각형",
  ellipse: "타원",
  diamond: "마름모",
  text: "텍스트",
  connector: "연결선"
};

export default function WhiteboardRoomPage() {
  const params = useParams<{ id: string }>();
  const boardId = Array.isArray(params.id) ? params.id[0] : params.id;

  const sessionForm = useAppForm<{
    displayName: string;
    requestedRole: "viewer" | "editor";
    editorAccessKey: string;
  }>({
    defaultValues: {
      displayName: "게스트",
      requestedRole: "editor",
      editorAccessKey: ""
    }
  });
  const displayName = sessionForm.watch("displayName");
  const requestedRole = sessionForm.watch("requestedRole");
  const editorAccessKey = sessionForm.watch("editorAccessKey");
  const [activeTool, setActiveTool] = useState<WhiteboardTool>("select");
  const [connectorFromShapeId, setConnectorFromShapeId] = useState<string | null>(null);

  const handleEditorRequestDenied = useCallback((resolvedRole: "viewer" | "editor") => {
    sessionForm.setValue("requestedRole", resolvedRole);
    setStoredRole(resolvedRole);
    sessionForm.setValue("editorAccessKey", "");
    setStoredEditorAccessKey("");
  }, [sessionForm]);

  useEffect(() => {
    const stored = getStoredDisplayName();
    const storedRole = getStoredRole();
    const storedEditorAccessKey = getStoredEditorAccessKey();
    const nextDisplayName = stored?.trim() ? stored : createGuestName();
    sessionForm.setValue("displayName", nextDisplayName);
    setStoredDisplayName(nextDisplayName);
    sessionForm.setValue("requestedRole", storedRole ?? "editor");
    sessionForm.setValue("editorAccessKey", storedEditorAccessKey ?? "");
  }, [sessionForm]);

  const boardQuery = useQuery({
    queryKey: whiteboardQueryKeys.board(boardId),
    queryFn: () => getBoard(boardId),
    enabled: Boolean(boardId),
    staleTime: 10 * 1000
  });

  const {
    sessionId,
    currentRole,
    isReadOnly,
    updateTitle,
    addShape,
    patchShape,
    removeShape,
    sendCursor,
    undo,
    redo
  } = useWhiteboardRealtime({
    boardId,
    displayName,
    role: requestedRole,
    editorAccessKey,
    initialBoard: boardQuery.data?.board,
    onEditorRequestDenied: handleEditorRequestDenied
  });

  const title = useWhiteboardStore.use.title();
  const shapes = useWhiteboardStore.use.shapes();
  const version = useWhiteboardStore.use.version();
  const updatedAt = useWhiteboardStore.use.updatedAt();
  const participants = useWhiteboardStore.use.participants();
  const connection = useWhiteboardStore.use.connection();
  const eventLog = useWhiteboardStore.use.eventLog();
  const conflictMessage = useWhiteboardStore.use.conflictMessage();

  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ shapeId: string; offsetX: number; offsetY: number } | null>(null);
  const resizeRef = useRef<{
    shapeId: string;
    shapeType: WhiteboardShape["type"];
    handle: ResizeHandle;
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const connectorResizeRef = useRef<{
    shapeId: string;
    handle: ConnectorHandle;
  } | null>(null);
  const pendingShapePatchRef = useRef<{ shapeId: string; patch: Partial<WhiteboardShape> } | null>(null);
  const patchRafRef = useRef<number | null>(null);

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const {
    isOpen: isCreateTextDialogOpen,
    setIsOpen: setIsCreateTextDialogOpen,
    onOpen: openCreateTextDialog,
    onClose: closeCreateTextDialog
  } = useDisclosure();
  const createTextForm = useAppForm<{ newTextDraft: string }>({
    defaultValues: { newTextDraft: "새 텍스트" }
  });
  const newTextDraft = createTextForm.watch("newTextDraft");
  const [pendingTextPosition, setPendingTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingTextShapeId, setEditingTextShapeId] = useState<string | null>(null);
  const editTextForm = useAppForm<{ editingTextDraft: string }>({
    defaultValues: { editingTextDraft: "" }
  });
  const editingTextDraft = editTextForm.watch("editingTextDraft");

  const nodeShapes = useMemo(() => shapes.filter((shape) => shape.type !== "connector"), [shapes]);
  const connectorShapes = useMemo(() => shapes.filter((shape) => shape.type === "connector"), [shapes]);
  const shapeById = useMemo(() => new Map(shapes.map((shape) => [shape.id, shape] as const)), [shapes]);
  const nodeShapeById = useMemo(
    () => new Map(nodeShapes.map((shape) => [shape.id, shape] as const)),
    [nodeShapes]
  );
  const selectedShape = useMemo(
    () => shapes.find((shape) => shape.id === selectedShapeId) ?? null,
    [selectedShapeId, shapes]
  );
  const otherParticipants = useMemo(
    () => participants.filter((participant) => participant.sessionId !== sessionId),
    [participants, sessionId]
  );
  const boardHistoryEntries = useMemo(() => {
    return [...shapes]
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt).getTime();
        const bTime = new Date(b.updatedAt).getTime();
        return bTime - aTime;
      })
      .map((shape) => ({
        id: shape.id,
        shapeType: shape.type,
        updatedAt: shape.updatedAt,
        actor: shape.createdBy || "unknown"
      }));
  }, [shapes]);

  const toBoardPoint = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: Math.max(0, Math.min(rect.width - 10, clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height - 10, clientY - rect.top))
    };
  };

  const flushPendingShapePatch = useCallback(() => {
    const pending = pendingShapePatchRef.current;
    patchRafRef.current = null;
    if (!pending) {
      return;
    }

    pendingShapePatchRef.current = null;
    patchShape(pending.shapeId, pending.patch);
  }, [patchShape]);

  const scheduleShapePatch = useCallback(
    (shapeId: string, patch: Partial<WhiteboardShape>) => {
      const pending = pendingShapePatchRef.current;
      if (pending && pending.shapeId === shapeId) {
        pendingShapePatchRef.current = {
          shapeId,
          patch: { ...pending.patch, ...patch }
        };
      } else {
        if (pending) {
          patchShape(pending.shapeId, pending.patch);
        }

        pendingShapePatchRef.current = { shapeId, patch };
      }

      if (patchRafRef.current !== null) {
        return;
      }

      patchRafRef.current = globalThis.requestAnimationFrame(() => {
        flushPendingShapePatch();
      });
    },
    [flushPendingShapePatch, patchShape]
  );

  const clearPointerActions = useCallback(() => {
    dragRef.current = null;
    resizeRef.current = null;
    connectorResizeRef.current = null;
    flushPendingShapePatch();
  }, [flushPendingShapePatch]);

  useEffect(() => {
    return () => {
      if (patchRafRef.current !== null) {
        globalThis.cancelAnimationFrame(patchRafRef.current);
        patchRafRef.current = null;
      }

      const pending = pendingShapePatchRef.current;
      if (!pending) {
        return;
      }

      pendingShapePatchRef.current = null;
      patchShape(pending.shapeId, pending.patch);
    };
  }, [patchShape]);

  const removeShapeWithLinks = useCallback(
    (shapeId: string) => {
      const target = shapes.find((shape) => shape.id === shapeId);
      if (!target) {
        return;
      }

      if (target.type !== "connector") {
        const linkedConnectors = shapes.filter(
          (shape) =>
            shape.type === "connector" && (shape.fromShapeId === target.id || shape.toShapeId === target.id)
        );

        for (const connector of linkedConnectors) {
          removeShape(connector.id);
        }
      }

      removeShape(shapeId);

      if (selectedShapeId === shapeId) {
        setSelectedShapeId(null);
      }
      if (connectorFromShapeId === shapeId) {
        setConnectorFromShapeId(null);
      }
    },
    [connectorFromShapeId, removeShape, selectedShapeId, shapes]
  );

  const createShapeByActiveTool = (placementPoint?: { x: number; y: number }) => {
    if (isReadOnly) {
      return;
    }

    if (activeTool === "connector") {
      return;
    }

    if (activeTool === "text") {
      if (placementPoint) {
        const textPreset = shapePreset.text;
        setPendingTextPosition({
          x: Math.max(16, Math.round(placementPoint.x - textPreset.w / 2)),
          y: Math.max(16, Math.round(placementPoint.y - textPreset.h / 2))
        });
      } else {
        setPendingTextPosition(null);
      }
      createTextForm.setValue("newTextDraft", "새 텍스트");
      openCreateTextDialog();
      return;
    }

    const shapeType: NodeShapeType = activeTool === "select" ? "rect" : activeTool;
    const preset = shapePreset[shapeType];
    const x = placementPoint
      ? Math.max(16, Math.round(placementPoint.x - preset.w / 2))
      : 80 + (nodeShapes.length % 8) * 24;
    const y = placementPoint
      ? Math.max(16, Math.round(placementPoint.y - preset.h / 2))
      : 80 + (nodeShapes.length % 6) * 24;
    const created = makeShape(shapeType, sessionId, x, y);
    addShape(created);
    setSelectedShapeId(created.id);
  };

  useEffect(() => {
    if (!selectedShapeId) {
      return;
    }

    if (!shapes.some((shape) => shape.id === selectedShapeId)) {
      setSelectedShapeId(null);
    }
  }, [selectedShapeId, shapes]);

  useEffect(() => {
    if (!editingTextShapeId) {
      return;
    }

    if (!shapes.some((shape) => shape.id === editingTextShapeId)) {
      setEditingTextShapeId(null);
      editTextForm.setValue("editingTextDraft", "");
    }
  }, [editingTextShapeId, editTextForm, shapes]);

  useEffect(() => {
    if (!connectorFromShapeId) {
      return;
    }

    if (!nodeShapeById.has(connectorFromShapeId)) {
      setConnectorFromShapeId(null);
    }
  }, [connectorFromShapeId, nodeShapeById]);

  useEffect(() => {
    if (activeTool !== "connector") {
      setConnectorFromShapeId(null);
    }
  }, [activeTool]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isReadOnly || !selectedShapeId) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeShapeWithLinks(selectedShapeId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isReadOnly, removeShapeWithLinks, selectedShapeId]);

  if (!boardId) {
    return null;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-10">
      <header className="mb-6 rounded-2xl border border-default bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-default bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:border-primary/40 hover:text-primary"
            >
              보드 목록으로
            </Link>
            <Badge variant="outline" size="md">
              보드 ID: {boardId.slice(0, 8)}...
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" size="md">
              연결: {connectionLabel[connection]}
            </Badge>
            <Badge
              variant={currentRole === "editor" ? "success" : "outline"}
              size="md"
              data-testid="board-current-role"
            >
              권한: {currentRole}
            </Badge>
            <Badge variant="outline" size="md">
              도구: {toolLabel[activeTool]}
            </Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <RhfField
            control={sessionForm.control}
            name="displayName"
            render={({ field }) => (
              <Input
                title={collabFieldCopy.displayNameLabel}
                value={field.value}
                onChange={(event) => {
                  field.onChange(event);
                  setStoredDisplayName(event.target.value.trim() || createGuestName());
                }}
                placeholder={collabFieldCopy.displayNamePlaceholder}
                size="md"
              />
            )}
          />
          <RhfField
            control={sessionForm.control}
            name="requestedRole"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  const nextRole = value === "viewer" ? "viewer" : "editor";
                  field.onChange(nextRole);
                  setStoredRole(nextRole);
                }}
              >
                <SelectTrigger size="md" title={collabFieldCopy.requestRolePlaceholder}>
                  <SelectValue placeholder={collabFieldCopy.requestRolePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">{collabFieldCopy.requestOptionEditor}</SelectItem>
                  <SelectItem value="viewer">{collabFieldCopy.requestOptionViewer}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <RhfField
            control={sessionForm.control}
            name="editorAccessKey"
            render={({ field }) => (
              <Input
                title={collabFieldCopy.editorAccessKeyLabel}
                type="password"
                value={field.value}
                onChange={(event) => {
                  field.onChange(event);
                  setStoredEditorAccessKey(event.target.value);
                }}
                placeholder={collabFieldCopy.editorAccessKeyPlaceholder}
                size="md"
              />
            )}
          />
        </div>
      </header>

      <section className="mb-4 rounded-2xl border border-default bg-surface p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <Input
            title="보드 제목"
            value={title}
            onChange={(event) => updateTitle(event.target.value)}
            readOnly={isReadOnly}
            size="md"
            className="text-base font-semibold"
            placeholder="보드 제목"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="md"
              disabled={isReadOnly || activeTool === "connector"}
              onClick={() => createShapeByActiveTool()}
            >
              {activeTool === "text" ? "텍스트 추가" : "도형 추가"}
            </Button>
            <Button
              variant="destructive"
              size="md"
              disabled={isReadOnly || !selectedShapeId}
              onClick={() => {
                if (!selectedShapeId) {
                  return;
                }

                removeShapeWithLinks(selectedShapeId);
              }}
            >
              선택 삭제
            </Button>
            <Button variant="outline" size="md" onClick={undo} disabled={isReadOnly}>
              Undo
            </Button>
            <Button variant="outline" size="md" onClick={redo} disabled={isReadOnly}>
              Redo
            </Button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Select
            value={activeTool}
            onValueChange={(value) => {
              const nextTool = value as WhiteboardTool;
              setActiveTool(nextTool);
            }}
          >
            <SelectTrigger size="md" title="도구 선택">
              <SelectValue placeholder="도구 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select">선택 / 이동</SelectItem>
              <SelectItem value="rect">사각형</SelectItem>
              <SelectItem value="ellipse">타원</SelectItem>
              <SelectItem value="diamond">마름모</SelectItem>
              <SelectItem value="text">텍스트</SelectItem>
              <SelectItem value="connector">연결선</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="px-3 py-2 text-body-sm text-muted">버전 {version}</Card>
            <Card className="px-3 py-2 text-body-sm text-muted">
              {updatedAt
                ? `최근 수정: ${formatRelativeTime(updatedAt)} (${formatExactTime(updatedAt)})`
                : "최근 수정 -"}
            </Card>
          </div>
        </div>
      </section>

      {activeTool === "connector" && !isReadOnly ? (
        <StateView
          variant="info"
          size="sm"
          align="left"
          className="mb-4"
          title={
            connectorFromShapeId
              ? "시작 도형이 선택되었습니다. 연결할 대상 도형을 클릭하세요."
              : "연결선 모드입니다. 시작 도형을 클릭한 뒤, 대상 도형을 클릭하면 선이 생성됩니다."
          }
        />
      ) : null}

      <Dialog
        open={isCreateTextDialogOpen}
        onOpenChange={(open) => {
          setIsCreateTextDialogOpen(open);
          if (!open) {
            createTextForm.setValue("newTextDraft", "새 텍스트");
            setPendingTextPosition(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>텍스트 추가</DialogTitle>
            <DialogDescription>보드에 생성할 텍스트를 입력하세요.</DialogDescription>
          </DialogHeader>
          <RhfField
            control={createTextForm.control}
            name="newTextDraft"
            render={({ field }) => (
              <Input
                autoFocus
                value={field.value}
                onChange={field.onChange}
                placeholder="텍스트를 입력하세요"
              />
            )}
          />
          <DialogFooter
            confirmText="생성"
            confirmVariant="default"
            onCancel={() => {
              closeCreateTextDialog();
              createTextForm.setValue("newTextDraft", "새 텍스트");
              setPendingTextPosition(null);
            }}
            onConfirm={() => {
              const normalizedText = newTextDraft.trim();
              if (!normalizedText) {
                return;
              }

              const x = pendingTextPosition?.x ?? 120 + (nodeShapes.length % 7) * 20;
              const y = pendingTextPosition?.y ?? 120 + (nodeShapes.length % 5) * 20;
              const created = makeShape("text", sessionId, x, y, normalizedText);
              addShape(created);
              setSelectedShapeId(created.id);
              closeCreateTextDialog();
              createTextForm.setValue("newTextDraft", "새 텍스트");
              setPendingTextPosition(null);
            }}
            confirmDisabled={!newTextDraft.trim()}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingTextShapeId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTextShapeId(null);
            editTextForm.setValue("editingTextDraft", "");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>텍스트 수정</DialogTitle>
            <DialogDescription>선택한 텍스트 내용을 수정합니다.</DialogDescription>
          </DialogHeader>
          <RhfField
            control={editTextForm.control}
            name="editingTextDraft"
            render={({ field }) => (
              <Input
                autoFocus
                value={field.value}
                onChange={field.onChange}
                placeholder="텍스트를 입력하세요"
              />
            )}
          />
          <DialogFooter
            confirmText="저장"
            confirmVariant="default"
            onCancel={() => {
              setEditingTextShapeId(null);
              editTextForm.setValue("editingTextDraft", "");
            }}
            onConfirm={() => {
              const normalizedText = editingTextDraft.trim();
              if (!normalizedText || !editingTextShapeId) {
                return;
              }

              patchShape(editingTextShapeId, { text: normalizedText });
              setEditingTextShapeId(null);
              editTextForm.setValue("editingTextDraft", "");
            }}
            confirmDisabled={!editingTextDraft.trim() || !editingTextShapeId}
          />
        </DialogContent>
      </Dialog>

      {conflictMessage ? (
        <StateView variant="warning" size="sm" align="left" className="mb-4" title={conflictMessage} />
      ) : null}
      {isReadOnly ? (
        <StateView
          variant="info"
          size="sm"
          align="left"
          className="mb-4"
          title="보기 전용(`viewer`) 세션입니다."
          description="상단에서 `editor 요청`으로 바꾸고 편집 키를 입력하면 재요청됩니다. 보드 편집은 제한되며 참여자 커서 확인만 가능합니다."
        />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_384px]">
        <div
          ref={boardRef}
          className="board-grid relative h-[72vh] min-h-[520px] rounded-2xl border border-default bg-surface/90"
          onMouseDown={(event) => {
            if (event.target === boardRef.current) {
              if (!isReadOnly && activeTool !== "select" && activeTool !== "connector") {
                const point = toBoardPoint(event.clientX, event.clientY);
                createShapeByActiveTool(point);
                return;
              }

              setSelectedShapeId(null);
              setConnectorFromShapeId(null);
            }
          }}
          onMouseMove={(event) => {
            const point = toBoardPoint(event.clientX, event.clientY);
            sendCursor(point.x, point.y);

            const connectorResizing = connectorResizeRef.current;
            if (connectorResizing) {
              const connector = shapeById.get(connectorResizing.shapeId);
              if (!connector || connector.type !== "connector") {
                connectorResizeRef.current = null;
                return;
              }

              const currentEndpoints = resolveConnectorEndpoints(connector, nodeShapeById);
              if (!currentEndpoints) {
                return;
              }

              const snappedNode = findNearestNodeCenter(point, nodeShapes);
              const snappedPoint = snappedNode ? { x: snappedNode.x, y: snappedNode.y } : point;

              const startPoint =
                connectorResizing.handle === "start"
                  ? snappedPoint
                  : { x: currentEndpoints.startX, y: currentEndpoints.startY };
              const endPoint =
                connectorResizing.handle === "end"
                  ? snappedPoint
                  : { x: currentEndpoints.endX, y: currentEndpoints.endY };

              scheduleShapePatch(connector.id, {
                fromShapeId:
                  connectorResizing.handle === "start" ? snappedNode?.shapeId : connector.fromShapeId,
                toShapeId: connectorResizing.handle === "end" ? snappedNode?.shapeId : connector.toShapeId,
                startX: Math.round(startPoint.x),
                startY: Math.round(startPoint.y),
                endX: Math.round(endPoint.x),
                endY: Math.round(endPoint.y),
                x: Math.min(startPoint.x, endPoint.x),
                y: Math.min(startPoint.y, endPoint.y),
                w: Math.abs(endPoint.x - startPoint.x),
                h: Math.abs(endPoint.y - startPoint.y)
              });
              return;
            }

            const resizing = resizeRef.current;
            if (resizing) {
              const deltaX = point.x - resizing.pointerX;
              const deltaY = point.y - resizing.pointerY;

              let nextX = resizing.x;
              let nextY = resizing.y;
              let nextW = resizing.w;
              let nextH = resizing.h;

              if (resizing.handle.includes("e")) {
                nextW = resizing.w + deltaX;
              }
              if (resizing.handle.includes("s")) {
                nextH = resizing.h + deltaY;
              }
              if (resizing.handle.includes("w")) {
                nextW = resizing.w - deltaX;
                nextX = resizing.x + deltaX;
              }
              if (resizing.handle.includes("n")) {
                nextH = resizing.h - deltaY;
                nextY = resizing.y + deltaY;
              }

              const minWidth = resizing.shapeType === "text" ? 120 : 36;
              const minHeight = resizing.shapeType === "text" ? 44 : 36;

              if (nextW < minWidth) {
                if (resizing.handle.includes("w")) {
                  nextX -= minWidth - nextW;
                }
                nextW = minWidth;
              }

              if (nextH < minHeight) {
                if (resizing.handle.includes("n")) {
                  nextY -= minHeight - nextH;
                }
                nextH = minHeight;
              }

              scheduleShapePatch(resizing.shapeId, {
                x: Math.round(nextX),
                y: Math.round(nextY),
                w: Math.round(nextW),
                h: Math.round(nextH)
              });
              return;
            }

            const dragging = dragRef.current;
            if (!dragging) {
              return;
            }

            scheduleShapePatch(dragging.shapeId, {
              x: Math.round(point.x - dragging.offsetX),
              y: Math.round(point.y - dragging.offsetY)
            });
          }}
          onMouseUp={clearPointerActions}
          onMouseLeave={clearPointerActions}
        >
          <svg className="pointer-events-none absolute inset-0 z-[12] h-full w-full">
            {connectorShapes.map((connector) => {
              const endpoints = resolveConnectorEndpoints(connector, nodeShapeById);
              if (!endpoints) {
                return null;
              }

              const isSelected = selectedShapeId === connector.id;
              const strokeColor = connector.stroke || PRIMITIVE_COLOR_PALETTE.NATURAL_700;
              const dx = endpoints.endX - endpoints.startX;
              const dy = endpoints.endY - endpoints.startY;
              const length = Math.hypot(dx, dy) || 1;
              const offset = 10;
              const startHandleX = endpoints.startX + (dx / length) * offset;
              const startHandleY = endpoints.startY + (dy / length) * offset;
              const endHandleX = endpoints.endX - (dx / length) * offset;
              const endHandleY = endpoints.endY - (dy / length) * offset;

              return (
                <g key={connector.id}>
                  <line
                    x1={endpoints.startX}
                    y1={endpoints.startY}
                    x2={endpoints.endX}
                    y2={endpoints.endY}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : 2}
                    className="pointer-events-none"
                  />
                  <circle
                    cx={endpoints.endX}
                    cy={endpoints.endY}
                    r={isSelected ? 4 : 3}
                    fill={strokeColor}
                    className="pointer-events-none"
                  />
                  <line
                    x1={endpoints.startX}
                    y1={endpoints.startY}
                    x2={endpoints.endX}
                    y2={endpoints.endY}
                    stroke="transparent"
                    strokeWidth={16}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      setSelectedShapeId(connector.id);
                    }}
                    className="pointer-events-auto cursor-pointer"
                  />

                  {!isReadOnly && isSelected ? (
                    <>
                      <line
                        x1={endpoints.startX}
                        y1={endpoints.startY}
                        x2={startHandleX}
                        y2={startHandleY}
                        stroke={strokeColor}
                        strokeOpacity={0.55}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        className="pointer-events-none"
                      />
                      <line
                        x1={endpoints.endX}
                        y1={endpoints.endY}
                        x2={endHandleX}
                        y2={endHandleY}
                        stroke={strokeColor}
                        strokeOpacity={0.55}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        className="pointer-events-none"
                      />
                      <circle
                        cx={startHandleX}
                        cy={startHandleY}
                        r={6}
                        fill="rgb(var(--ds-surface))"
                        stroke={strokeColor}
                        strokeWidth={2}
                        className="pointer-events-auto cursor-grab"
                        onMouseDown={(event) => {
                          event.stopPropagation();
                          setSelectedShapeId(connector.id);
                          connectorResizeRef.current = { shapeId: connector.id, handle: "start" };
                        }}
                      />
                      <circle
                        cx={endHandleX}
                        cy={endHandleY}
                        r={6}
                        fill="rgb(var(--ds-surface))"
                        stroke={strokeColor}
                        strokeWidth={2}
                        className="pointer-events-auto cursor-grab"
                        onMouseDown={(event) => {
                          event.stopPropagation();
                          setSelectedShapeId(connector.id);
                          connectorResizeRef.current = { shapeId: connector.id, handle: "end" };
                        }}
                      />
                    </>
                  ) : null}
                </g>
              );
            })}
          </svg>

          {nodeShapes.map((shape) => {
            const isSelected = selectedShapeId === shape.id;
            const isConnectorAnchor = connectorFromShapeId === shape.id;
            const canDragWithPointer = !isReadOnly && activeTool !== "connector";
            const ringClass = isSelected
              ? "ring-2 ring-primary"
              : isConnectorAnchor
                ? "ring-2 ring-success"
                : "";

            return (
              <div
                key={shape.id}
                className={`absolute z-10 select-none border text-xs ${shape.type === "ellipse" ? "rounded-full" : "rounded-md"} ${canDragWithPointer ? "cursor-move" : "cursor-pointer"} ${ringClass}`}
                style={{
                  left: `${shape.x}px`,
                  top: `${shape.y}px`,
                  width: `${shape.w}px`,
                  height: `${shape.h}px`,
                  background: shape.fill,
                  borderColor: shape.stroke,
                  color: shape.type === "text" ? PRIMITIVE_COLOR_PALETTE.NATURAL_900 : PRIMITIVE_COLOR_PALETTE.NATURAL_700,
                  clipPath:
                    shape.type === "diamond" ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : undefined
                }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  setSelectedShapeId(shape.id);

                  if (isReadOnly) {
                    return;
                  }

                  if (activeTool === "connector") {
                    if (!connectorFromShapeId) {
                      setConnectorFromShapeId(shape.id);
                      return;
                    }

                    if (connectorFromShapeId === shape.id) {
                      setConnectorFromShapeId(null);
                      return;
                    }

                    const fromShape = nodeShapeById.get(connectorFromShapeId);
                    if (!fromShape) {
                      setConnectorFromShapeId(null);
                      return;
                    }

                    const connector = makeConnector(fromShape, shape, sessionId);
                    addShape(connector);
                    setSelectedShapeId(connector.id);
                    setConnectorFromShapeId(null);
                    return;
                  }

                  const point = toBoardPoint(event.clientX, event.clientY);
                  dragRef.current = {
                    shapeId: shape.id,
                    offsetX: point.x - shape.x,
                    offsetY: point.y - shape.y
                  };
                }}
                onDoubleClick={() => {
                  if (isReadOnly || shape.type !== "text") {
                    return;
                  }

                  setEditingTextShapeId(shape.id);
                  editTextForm.setValue("editingTextDraft", shape.text ?? "");
                }}
              >
                {!isReadOnly ? (
                  <button
                    type="button"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeShapeWithLinks(shape.id);
                    }}
                    className="absolute -right-2 -top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-default bg-surface text-[10px] text-muted hover:bg-surface-elevated"
                  >
                    ×
                  </button>
                ) : null}

                {!isReadOnly && isSelected ? (
                  <>
                    {(Object.keys(resizeHandleStyle) as ResizeHandle[]).map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        onMouseDown={(event) => {
                          event.stopPropagation();
                          const point = toBoardPoint(event.clientX, event.clientY);
                          resizeRef.current = {
                            shapeId: shape.id,
                            shapeType: shape.type,
                            handle,
                            pointerX: point.x,
                            pointerY: point.y,
                            x: shape.x,
                            y: shape.y,
                            w: shape.w,
                            h: shape.h
                          };
                        }}
                        className="absolute z-20 h-3 w-3 rounded-full border border-primary bg-surface shadow"
                        style={resizeHandleStyle[handle]}
                        aria-label={`resize-${handle}`}
                      />
                    ))}
                  </>
                ) : null}

                {shape.type === "text" ? (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs font-medium text-foreground">
                    {shape.text || "텍스트"}
                  </div>
                ) : (
                  <div className="pointer-events-none flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {shape.type}
                  </div>
                )}
              </div>
            );
          })}

          {otherParticipants.map((participant) => (
            <div
              key={`${participant.socketId}-${participant.sessionId}`}
              className="pointer-events-none absolute z-30"
              style={{ left: participant.cursorX, top: participant.cursorY }}
            >
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: participant.color }} />
              <div className="mt-1 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-white">
                {participant.displayName}
              </div>
            </div>
          ))}
        </div>

        <BoardSidePanel
          participants={participants}
          sessionId={sessionId}
          activeTool={activeTool}
          selectedShape={selectedShape}
          connectorFromShapeId={connectorFromShapeId}
          historyEntries={boardHistoryEntries}
          eventLog={eventLog}
        />
      </div>
    </main>
  );
}
