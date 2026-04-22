import type { SeparatorLineStyle, SeparatorThickness } from "./separator.types";

export const SEPARATOR_DEFAULTS = {
  color: "default",
  inset: "none",
  thickness: "sm",
  lineStyle: "solid"
} as const;

export const SEPARATOR_COLOR_CLASS = {
  default: "bg-border",
  subtle: "bg-default/60",
  strong: "bg-foreground/20",
  primary: "bg-primary/40"
} as const;

export const SEPARATOR_BORDER_COLOR_CLASS = {
  default: "border-border",
  subtle: "border-default/60",
  strong: "border-foreground/20",
  primary: "border-primary/40"
} as const;

export const SEPARATOR_INSET_CLASS = {
  none: "",
  sm: "mx-[var(--space-2)]",
  md: "mx-[var(--space-4)]"
} as const;

export const SEPARATOR_THICKNESS_CLASS: Record<SeparatorThickness, { horizontal: string; vertical: string }> = {
  sm: { horizontal: "h-[var(--size-border-hairline)]", vertical: "w-[var(--size-border-hairline)]" },
  md: { horizontal: "h-[var(--size-border-thin)]", vertical: "w-[var(--size-border-thin)]" },
  lg: { horizontal: "h-[var(--space-1)]", vertical: "w-[var(--space-1)]" }
};

export const SEPARATOR_LINE_STYLE_CLASS: Record<SeparatorLineStyle, string> = {
  solid: "border-0",
  dashed: "border-dashed bg-transparent",
  dotted: "border-dotted bg-transparent"
};
