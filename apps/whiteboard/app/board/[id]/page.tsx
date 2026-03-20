"use client";

import Link from "next/link";
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
  SelectValue
} from "@repo/ui";
import { getBoard } from "@/lib/api";
import { whiteboardClientEnv } from "@/lib/env";
import { useWhiteboardRealtime } from "@/hooks/use-whiteboard-realtime";
import { useWhiteboardStore } from "@/stores/use-whiteboard-store";
import { WhiteboardShape } from "@/lib/types";
import {
  createGuestName,
  getStoredDisplayName,
  getStoredEditorAccessKey,
  getStoredRole,
  setStoredEditorAccessKey
} from "@/lib/session";
import { formatExactTime, formatRelativeTime } from "@/lib/time";

type WhiteboardTool = "select" | "rect" | "ellipse" | "diamond" | "text" | "connector";
type ResizeHandle = "nw" | "ne" | "sw" | "se";
type ConnectorHandle = "start" | "end";
type NodeShapeType = Exclude<WhiteboardShape["type"], "connector">;
const CONNECTOR_SNAP_RADIUS = 36;

const shapePreset: Record<NodeShapeType, { fill: string; stroke: string; w: number; h: number }> = {
  rect: { fill: "#bfdbfe", stroke: "#2563eb", w: 140, h: 100 },
  ellipse: { fill: "#dcfce7", stroke: "#16a34a", w: 150, h: 104 },
  diamond: { fill: "#fef3c7", stroke: "#d97706", w: 148, h: 106 },
  text: { fill: "#fef3c7", stroke: "#f59e0b", w: 180, h: 56 }
};

const resizeHandleStyle: Record<ResizeHandle, CSSProperties> = {
  nw: { left: -6, top: -6, cursor: "nwse-resize" },
  ne: { right: -6, top: -6, cursor: "nesw-resize" },
  sw: { left: -6, bottom: -6, cursor: "nesw-resize" },
  se: { right: -6, bottom: -6, cursor: "nwse-resize" }
};

const centerPointOfShape = (shape: WhiteboardShape) => ({
  x: Math.round(shape.x + shape.w / 2),
  y: Math.round(shape.y + shape.h / 2)
});

const makeShape = (
  type: NodeShapeType,
  createdBy: string,
  x = 80,
  y = 80,
  text?: string
): WhiteboardShape => {
  const preset = shapePreset[type];

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    x,
    y,
    w: preset.w,
    h: preset.h,
    text,
    fill: preset.fill,
    stroke: preset.stroke,
    createdBy,
    updatedAt: new Date().toISOString()
  };
};

const makeConnector = (from: WhiteboardShape, to: WhiteboardShape, createdBy: string): WhiteboardShape => {
  const start = centerPointOfShape(from);
  const end = centerPointOfShape(to);

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "connector",
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
    fromShapeId: from.id,
    toShapeId: to.id,
    startX: start.x,
    startY: start.y,
    endX: end.x,
    endY: end.y,
    fill: "transparent",
    stroke: "#475569",
    createdBy,
    updatedAt: new Date().toISOString()
  };
};

const resolveConnectorEndpoints = (
  connector: WhiteboardShape,
  byId: Map<string, WhiteboardShape>
): { startX: number; startY: number; endX: number; endY: number } | null => {
  const fromShape = connector.fromShapeId ? byId.get(connector.fromShapeId) : undefined;
  const toShape = connector.toShapeId ? byId.get(connector.toShapeId) : undefined;

  const start = fromShape ? centerPointOfShape(fromShape) : null;
  const end = toShape ? centerPointOfShape(toShape) : null;

  const startX = start?.x ?? connector.startX ?? connector.x;
  const startY = start?.y ?? connector.startY ?? connector.y;
  const endX = end?.x ?? connector.endX ?? connector.x + connector.w;
  const endY = end?.y ?? connector.endY ?? connector.y + connector.h;

  if ([startX, startY, endX, endY].some((value) => Number.isNaN(value))) {
    return null;
  }

  return {
    startX: Math.round(startX),
    startY: Math.round(startY),
    endX: Math.round(endX),
    endY: Math.round(endY)
  };
};

const findNearestNodeCenter = (
  point: { x: number; y: number },
  nodeShapes: WhiteboardShape[],
  radius = CONNECTOR_SNAP_RADIUS
): { shapeId: string; x: number; y: number } | null => {
  const maxDistanceSquared = radius * radius;
  let bestMatch: { shapeId: string; x: number; y: number } | null = null;
  let bestDistanceSquared = Number.POSITIVE_INFINITY;

  for (const shape of nodeShapes) {
    if (shape.type === "connector") {
      continue;
    }

    const center = centerPointOfShape(shape);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared > maxDistanceSquared || distanceSquared >= bestDistanceSquared) {
      continue;
    }

    bestDistanceSquared = distanceSquared;
    bestMatch = {
      shapeId: shape.id,
      x: center.x,
      y: center.y
    };
  }

  return bestMatch;
};

export default function WhiteboardRoomPage() {
  const params = useParams<{ id: string }>();
  const boardId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [displayName, setDisplayName] = useState("게스트");
  const [requestedRole, setRequestedRole] = useState<"viewer" | "editor">("editor");
  const [editorAccessKey, setEditorAccessKey] = useState<string>("");
  const [activeTool, setActiveTool] = useState<WhiteboardTool>("select");
  const [connectorFromShapeId, setConnectorFromShapeId] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredDisplayName();
    const storedRole = getStoredRole();
    const storedEditorAccessKey = getStoredEditorAccessKey();
    setDisplayName(stored?.trim() ? stored : createGuestName());
    setRequestedRole(storedRole ?? "editor");
    setEditorAccessKey(storedEditorAccessKey ?? whiteboardClientEnv.editorAccessKey ?? "");
  }, []);

  const boardQuery = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoard(boardId),
    enabled: Boolean(boardId)
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
    initialBoard: boardQuery.data?.board
  });

  const title = useWhiteboardStore((state) => state.title);
  const shapes = useWhiteboardStore((state) => state.shapes);
  const version = useWhiteboardStore((state) => state.version);
  const updatedAt = useWhiteboardStore((state) => state.updatedAt);
  const participants = useWhiteboardStore((state) => state.participants);
  const connection = useWhiteboardStore((state) => state.connection);
  const eventLog = useWhiteboardStore((state) => state.eventLog);
  const conflictMessage = useWhiteboardStore((state) => state.conflictMessage);

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
  const [isCreateTextDialogOpen, setIsCreateTextDialogOpen] = useState(false);
  const [newTextDraft, setNewTextDraft] = useState("새 텍스트");
  const [pendingTextPosition, setPendingTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingTextShapeId, setEditingTextShapeId] = useState<string | null>(null);
  const [editingTextDraft, setEditingTextDraft] = useState("");

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
      setNewTextDraft("새 텍스트");
      setIsCreateTextDialogOpen(true);
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
      setEditingTextDraft("");
    }
  }, [editingTextShapeId, shapes]);

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
    <main className="mx-auto min-h-screen w-full max-w-[1400px] px-4 py-6 md:px-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-100"
          >
            보드 목록
          </Link>
          <Badge variant="outline">화이트보드</Badge>
          <Badge variant="outline">연결: {connection}</Badge>
          <Badge variant="outline">권한: {currentRole}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={activeTool}
            onValueChange={(value) => {
              const nextTool = value as WhiteboardTool;
              setActiveTool(nextTool);
            }}
          >
            <SelectTrigger className="w-[180px]">
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

          <Button
            variant="outline"
            disabled={isReadOnly || activeTool === "connector"}
            onClick={() => createShapeByActiveTool()}
          >
            {activeTool === "text" ? "텍스트 추가" : "도형 추가"}
          </Button>
          <Button
            variant="destructive"
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
          <Button variant="outline" onClick={undo} disabled={isReadOnly}>
            Undo
          </Button>
          <Button variant="outline" onClick={redo} disabled={isReadOnly}>
            Redo
          </Button>
        </div>
      </header>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px_auto_auto] md:items-center">
        <Input
          value={title}
          onChange={(event) => updateTitle(event.target.value)}
          readOnly={isReadOnly}
          className="h-11 text-base font-semibold"
        />
        <Input
          type="password"
          value={editorAccessKey}
          onChange={(event) => {
            const nextValue = event.target.value;
            setEditorAccessKey(nextValue);
            setStoredEditorAccessKey(nextValue);
          }}
          placeholder="편집 키 (선택)"
          className="h-11"
        />
        <Card className="px-3 py-2 text-xs text-slate-600">버전 {version}</Card>
        <Card className="px-3 py-2 text-xs text-slate-600">
          {updatedAt
            ? `최근 수정: ${formatRelativeTime(updatedAt)} (${formatExactTime(updatedAt)})`
            : "최근 수정 -"}
        </Card>
      </div>

      {activeTool === "connector" && !isReadOnly ? (
        <Card className="mb-4 border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
          {connectorFromShapeId
            ? "시작 도형이 선택되었습니다. 연결할 대상 도형을 클릭하세요."
            : "연결선 모드입니다. 시작 도형을 클릭한 뒤, 대상 도형을 클릭하면 선이 생성됩니다."}
        </Card>
      ) : null}

      <Dialog
        open={isCreateTextDialogOpen}
        onOpenChange={(open) => {
          setIsCreateTextDialogOpen(open);
          if (!open) {
            setNewTextDraft("새 텍스트");
            setPendingTextPosition(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>텍스트 추가</DialogTitle>
            <DialogDescription>보드에 생성할 텍스트를 입력하세요.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={newTextDraft}
            onChange={(event) => setNewTextDraft(event.target.value)}
            placeholder="텍스트를 입력하세요"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateTextDialogOpen(false);
                setNewTextDraft("새 텍스트");
                setPendingTextPosition(null);
              }}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                const normalizedText = newTextDraft.trim();
                if (!normalizedText) {
                  return;
                }

                const x = pendingTextPosition?.x ?? 120 + (nodeShapes.length % 7) * 20;
                const y = pendingTextPosition?.y ?? 120 + (nodeShapes.length % 5) * 20;
                const created = makeShape("text", sessionId, x, y, normalizedText);
                addShape(created);
                setSelectedShapeId(created.id);
                setIsCreateTextDialogOpen(false);
                setNewTextDraft("새 텍스트");
                setPendingTextPosition(null);
              }}
              disabled={!newTextDraft.trim()}
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingTextShapeId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTextShapeId(null);
            setEditingTextDraft("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>텍스트 수정</DialogTitle>
            <DialogDescription>선택한 텍스트 내용을 수정합니다.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={editingTextDraft}
            onChange={(event) => setEditingTextDraft(event.target.value)}
            placeholder="텍스트를 입력하세요"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTextShapeId(null);
                setEditingTextDraft("");
              }}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                const normalizedText = editingTextDraft.trim();
                if (!normalizedText || !editingTextShapeId) {
                  return;
                }

                patchShape(editingTextShapeId, { text: normalizedText });
                setEditingTextShapeId(null);
                setEditingTextDraft("");
              }}
              disabled={!editingTextDraft.trim() || !editingTextShapeId}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {conflictMessage ? (
        <Card className="mb-4 border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
          {conflictMessage}
        </Card>
      ) : null}
      {isReadOnly ? (
        <Card className="mb-4 border-slate-300 bg-slate-100 p-3 text-sm text-slate-700">
          보기 전용(`viewer`) 세션입니다. 보드 편집은 제한되며 참여자 커서 확인만 가능합니다.
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div
          ref={boardRef}
          className="board-grid relative h-[70vh] rounded-2xl border border-slate-300 bg-white/90"
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
              const strokeColor = connector.stroke || "#475569";
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
                        fill="white"
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
                        fill="white"
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
              ? "ring-2 ring-cyan-400"
              : isConnectorAnchor
                ? "ring-2 ring-emerald-500"
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
                  color: shape.type === "text" ? "#1f2937" : "#475569",
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
                  setEditingTextDraft(shape.text ?? "");
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
                    className="absolute -right-2 -top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] text-slate-700 hover:bg-slate-100"
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
                        className="absolute z-20 h-3 w-3 rounded-full border border-cyan-500 bg-white shadow"
                        style={resizeHandleStyle[handle]}
                        aria-label={`resize-${handle}`}
                      />
                    ))}
                  </>
                ) : null}

                {shape.type === "text" ? (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs font-medium text-slate-800">
                    {shape.text || "텍스트"}
                  </div>
                ) : (
                  <div className="pointer-events-none flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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
                <div className="mt-1 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white">
                  {participant.displayName}
                </div>
              </div>
            ))}
        </div>

        <div className="space-y-3">
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold">참여자</h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={`${participant.socketId}-${participant.sessionId}`}
                  className="flex items-center justify-between rounded border border-slate-200 bg-white p-2"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: participant.color }}
                    />
                    <span>
                      {participant.displayName}
                      {participant.sessionId === sessionId ? " (나)" : ""}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        participant.role === "editor"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {participant.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {Math.round(participant.cursorX)}, {Math.round(participant.cursorY)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold">선택 정보</h3>
            <div className="space-y-1 text-xs text-slate-600">
              <p>선택 도구: {activeTool}</p>
              <p>
                선택 요소:{" "}
                {selectedShape ? `${selectedShape.type} (${selectedShape.id.slice(0, 6)})` : "없음"}
              </p>
              <p>연결 시작점: {connectorFromShapeId ? connectorFromShapeId.slice(0, 6) : "없음"}</p>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold">실시간 이벤트</h3>
            <div className="max-h-80 space-y-1 overflow-auto">
              {eventLog.map((log) => (
                <p key={log} className="text-[11px] text-slate-600">
                  {log}
                </p>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
