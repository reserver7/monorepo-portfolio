import type { InputSize, InputStatus, InputVariant } from "./input.types";

export const INPUT_DEFAULTS = {
  size: "md",
  variant: "default",
  status: "default",
  clearable: false
} satisfies {
  size: InputSize;
  variant: InputVariant;
  status: InputStatus;
  clearable: boolean;
};

export const INPUT_SIZE_CLASS: Record<InputSize, string> = {
  sm: "h-9 text-body-sm",
  md: "h-11 text-body-md",
  lg: "h-12 text-body-md"
};

export const INPUT_VARIANT_CLASS: Record<InputVariant, string> = {
  default: "border-default bg-surface shadow-none hover:border-primary/35",
  outline: "border-2 border-primary/45 bg-transparent shadow-none hover:border-primary/70",
  filled: "border border-transparent bg-surface-elevated shadow-none hover:bg-[rgb(var(--color-bg-surface))]",
  ghost: "border border-transparent bg-transparent shadow-none hover:bg-surface-elevated/70 focus:bg-surface-elevated/80"
};

export const INPUT_STATUS_CLASS: Record<InputStatus, string> = {
  default: "focus:border-primary focus:ring-1 focus:ring-primary/30 focus:ring-offset-0",
  error: "border-danger/40 focus:border-danger focus:ring-1 focus:ring-danger/25 focus:ring-offset-0",
  success: "border-success/40 focus:border-success focus:ring-1 focus:ring-success/25 focus:ring-offset-0"
};

export const INPUT_DECORATED_STATUS_CLASS: Record<InputStatus, string> = {
  default: "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/25 focus-within:ring-offset-0",
  error: "border-danger/40 focus-within:border-danger focus-within:ring-1 focus-within:ring-danger/25 focus-within:ring-offset-0",
  success:
    "border-success/40 focus-within:border-success focus-within:ring-1 focus-within:ring-success/25 focus-within:ring-offset-0"
};

export const clearInputValue = (element: HTMLInputElement) => {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  descriptor?.set?.call(element, "");
  element.dispatchEvent(new Event("input", { bubbles: true }));
};
