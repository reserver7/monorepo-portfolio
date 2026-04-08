import type { FormFieldSize } from "./form-field.types";

export const FORM_FIELD_DEFAULTS = {
  size: "md",
  requiredMark: false
} as const;

export const FORM_FIELD_SIZE_CONFIG: Record<
  FormFieldSize,
  { label: "sm" | "md" | "lg"; gap: string; description: string; error: string }
> = {
  sm: {
    label: "sm",
    gap: "gap-1",
    description: "text-[11px]",
    error: "text-[11px]"
  },
  md: {
    label: "md",
    gap: "gap-1.5",
    description: "text-xs",
    error: "text-xs"
  },
  lg: {
    label: "lg",
    gap: "gap-2",
    description: "text-sm",
    error: "text-sm"
  }
};
