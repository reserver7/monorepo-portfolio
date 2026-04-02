import type { ShapeType, WhiteboardShape } from "../../../../../packages/utils/src/collab/server";
import { nowIso } from "./store-document-utils";

const normalizeShapeType = (rawType: WhiteboardShape["type"]): ShapeType => {
  if (rawType === "text" || rawType === "ellipse" || rawType === "diamond" || rawType === "connector") {
    return rawType;
  }

  return "rect";
};

const sanitizeShapeLink = (rawValue: string | undefined): string | undefined => {
  const value = rawValue?.trim();
  if (!value) {
    return undefined;
  }

  return value.slice(0, 100);
};

const sanitizeCoordinate = (rawValue: number | undefined): number | undefined => {
  if (typeof rawValue !== "number" || Number.isNaN(rawValue) || !Number.isFinite(rawValue)) {
    return undefined;
  }

  return Math.round(rawValue);
};

export const sanitizeShape = (shape: WhiteboardShape): WhiteboardShape => {
  const normalizedType = normalizeShapeType(shape.type);
  const now = shape.updatedAt || nowIso();

  if (normalizedType === "connector") {
    const startX = sanitizeCoordinate(shape.startX) ?? Math.round(shape.x);
    const startY = sanitizeCoordinate(shape.startY) ?? Math.round(shape.y);
    const endX = sanitizeCoordinate(shape.endX) ?? Math.round(shape.x + shape.w);
    const endY = sanitizeCoordinate(shape.endY) ?? Math.round(shape.y + shape.h);

    return {
      ...shape,
      type: normalizedType,
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      w: Math.abs(endX - startX),
      h: Math.abs(endY - startY),
      fromShapeId: sanitizeShapeLink(shape.fromShapeId),
      toShapeId: sanitizeShapeLink(shape.toShapeId),
      startX,
      startY,
      endX,
      endY,
      fill: "transparent",
      stroke: shape.stroke || "#475569",
      updatedAt: now
    };
  }

  const fallbackStyles: Record<Exclude<ShapeType, "connector">, { fill: string; stroke: string }> = {
    rect: { fill: "#bfdbfe", stroke: "#2563eb" },
    ellipse: { fill: "#dcfce7", stroke: "#16a34a" },
    diamond: { fill: "#fef3c7", stroke: "#d97706" },
    text: { fill: "#fef3c7", stroke: "#f59e0b" }
  };

  const fallback = fallbackStyles[normalizedType as Exclude<ShapeType, "connector">];

  return {
    ...shape,
    type: normalizedType,
    x: Math.round(shape.x),
    y: Math.round(shape.y),
    w: Math.max(28, Math.round(shape.w)),
    h: Math.max(22, Math.round(shape.h)),
    text: shape.text,
    fromShapeId: undefined,
    toShapeId: undefined,
    startX: undefined,
    startY: undefined,
    endX: undefined,
    endY: undefined,
    fill: shape.fill || fallback.fill,
    stroke: shape.stroke || fallback.stroke,
    updatedAt: now
  };
};
