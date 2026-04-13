import type { CSSProperties } from "react";
import { PRIMITIVE_COLOR_PALETTE } from "@repo/ui";
import type { WhiteboardShape } from "@/features/collaboration/model";

export type WhiteboardTool = "select" | "rect" | "ellipse" | "diamond" | "text" | "connector";
export type ResizeHandle = "nw" | "ne" | "sw" | "se";
export type ConnectorHandle = "start" | "end";
export type NodeShapeType = Exclude<WhiteboardShape["type"], "connector">;
export const CONNECTOR_SNAP_RADIUS = 36;

export const shapePreset: Record<NodeShapeType, { fill: string; stroke: string; w: number; h: number }> = {
  rect: { fill: PRIMITIVE_COLOR_PALETTE.BLUE_300, stroke: PRIMITIVE_COLOR_PALETTE.BLUE_700, w: 140, h: 100 },
  ellipse: {
    fill: PRIMITIVE_COLOR_PALETTE.GREEN_200,
    stroke: PRIMITIVE_COLOR_PALETTE.GREEN_600,
    w: 150,
    h: 104
  },
  diamond: {
    fill: PRIMITIVE_COLOR_PALETTE.YELLOW_200,
    stroke: PRIMITIVE_COLOR_PALETTE.ORANGE_600,
    w: 148,
    h: 106
  },
  text: {
    fill: PRIMITIVE_COLOR_PALETTE.YELLOW_200,
    stroke: PRIMITIVE_COLOR_PALETTE.YELLOW_600,
    w: 180,
    h: 56
  }
};

export const resizeHandleStyle: Record<ResizeHandle, CSSProperties> = {
  nw: { left: -6, top: -6, cursor: "nwse-resize" },
  ne: { right: -6, top: -6, cursor: "nesw-resize" },
  sw: { left: -6, bottom: -6, cursor: "nesw-resize" },
  se: { right: -6, bottom: -6, cursor: "nwse-resize" }
};

export const centerPointOfShape = (shape: WhiteboardShape) => ({
  x: Math.round(shape.x + shape.w / 2),
  y: Math.round(shape.y + shape.h / 2)
});

export const makeShape = (
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

export const makeConnector = (
  from: WhiteboardShape,
  to: WhiteboardShape,
  createdBy: string
): WhiteboardShape => {
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
    stroke: PRIMITIVE_COLOR_PALETTE.NATURAL_700,
    createdBy,
    updatedAt: new Date().toISOString()
  };
};

export const resolveConnectorEndpoints = (
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

export const findNearestNodeCenter = (
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
