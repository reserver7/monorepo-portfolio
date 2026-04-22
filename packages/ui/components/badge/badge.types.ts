import type * as React from "react";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "dangerSolid"
  | "destructive"
  | "info";

export type BadgeSize = "sm" | "md" | "lg";
export type BadgeShape = "pill" | "rounded" | "square";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  interactive?: boolean;
  truncate?: boolean;
  maxWidth?: number | string;
  removable?: boolean;
  removeLabel?: string;
  onRemove?: () => void;
}
