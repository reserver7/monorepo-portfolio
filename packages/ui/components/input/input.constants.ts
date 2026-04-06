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
  md: "h-10 text-body-md",
  lg: "h-11 text-body-md"
};

export const INPUT_VARIANT_CLASS: Record<InputVariant, string> = {
  default: "border-default bg-surface shadow-sm hover:border-primary/30",
  outline: "border-default bg-surface hover:border-primary/30",
  filled: "border-transparent bg-surface-elevated hover:border-default",
  ghost: "border-primary/25 bg-primary/6 shadow-none hover:border-primary/35 hover:bg-primary/10"
};

export const INPUT_STATUS_CLASS: Record<InputStatus, string> = {
  default: "focus:border-primary focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-surface",
  error: "border-danger/40 focus:border-danger focus:ring-danger/20",
  success: "border-success/40 focus:border-success focus:ring-success/20"
};

export const INPUT_DECORATED_STATUS_CLASS: Record<InputStatus, string> = {
  default:
    "focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-offset-2 focus-within:ring-offset-surface",
  error: "border-danger/40 focus-within:border-danger focus-within:ring-danger/20",
  success: "border-success/40 focus-within:border-success focus-within:ring-success/20"
};

export const clearInputValue = (element: HTMLInputElement) => {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  descriptor?.set?.call(element, "");
  element.dispatchEvent(new Event("input", { bubbles: true }));
};
