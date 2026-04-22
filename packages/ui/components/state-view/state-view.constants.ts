import { AlertCircle, AlertTriangle, CheckCircle2, Inbox, Info, Loader2 } from "lucide-react";
import type { StateLayout, StateSize, StateVariant } from "./state-view.types";

export const STATE_VIEW_DEFAULTS = {
  variant: "info",
  size: "md",
  align: "center",
  layout: "inline"
} as const;

export const STATE_VIEW_VARIANT_MAP: Record<
  StateVariant,
  { icon: typeof Inbox; box: string; border: string; text: string }
> = {
  empty: { icon: Inbox, box: "bg-surface", border: "border-default", text: "text-muted" },
  error: { icon: AlertCircle, box: "bg-danger/10", border: "border-danger/30", text: "text-danger" },
  warning: { icon: AlertTriangle, box: "bg-warning/10", border: "border-warning/30", text: "text-warning" },
  info: { icon: Info, box: "bg-info/10", border: "border-info/30", text: "text-info" },
  success: { icon: CheckCircle2, box: "bg-success/10", border: "border-success/30", text: "text-success" },
  loading: { icon: Loader2, box: "bg-surface-elevated", border: "border-default", text: "text-primary" }
};

export const STATE_VIEW_SIZE_CLASS: Record<StateSize, string> = {
  sm: "p-[var(--space-3)]",
  md: "p-[var(--space-4)]",
  lg: "p-[var(--space-6)]"
};

export const STATE_VIEW_LAYOUT_CLASS: Record<StateLayout, string> = {
  inline: "flex flex-row gap-[var(--space-3)]",
  stacked: "flex flex-col gap-[var(--space-2)]"
};

export const STATE_VIEW_ICON_SIZE_CLASS: Record<StateSize, string> = {
  sm: "h-[var(--size-icon-md)] w-[var(--size-icon-md)]",
  md: "h-[var(--size-icon-lg)] w-[var(--size-icon-lg)]",
  lg: "h-[var(--size-control-sm)] w-[var(--size-control-sm)]"
};

export const STATE_VIEW_TITLE_SIZE_CLASS: Record<StateSize, string> = {
  sm: "text-body-sm",
  md: "text-body-md",
  lg: "text-body-lg"
};

export const STATE_VIEW_DESCRIPTION_SIZE_CLASS: Record<StateSize, string> = {
  sm: "text-caption",
  md: "text-body-sm",
  lg: "text-body-sm"
};
