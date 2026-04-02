"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../cn";
import {
  BUTTON_DEFAULTS,
  BUTTON_SHAPE_CLASS,
  BUTTON_SIZE_CLASS,
  BUTTON_VARIANT_CLASS
} from "./button.constants";
import { useButtonDisabledState } from "./button.hooks";
import type { ButtonProps, ButtonVariantsInput } from "./button.types";

export const buttonVariants = ({
  variant = BUTTON_DEFAULTS.variant,
  size = BUTTON_DEFAULTS.size,
  shape = BUTTON_DEFAULTS.shape,
  fullWidth = BUTTON_DEFAULTS.fullWidth,
  className
}: ButtonVariantsInput) => {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50",
    BUTTON_VARIANT_CLASS[variant],
    BUTTON_SIZE_CLASS[size],
    BUTTON_SHAPE_CLASS[shape],
    fullWidth ? "w-full" : "w-auto",
    className
  );
};

function ButtonSpinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      loading = false,
      loadingLabel,
      variant = BUTTON_DEFAULTS.variant,
      size = BUTTON_DEFAULTS.size,
      shape = BUTTON_DEFAULTS.shape,
      fullWidth = BUTTON_DEFAULTS.fullWidth,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      type,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = useButtonDisabledState(disabled, loading);
    const resolvedType = asChild ? undefined : (type ?? "button");
    const content = loading && loadingLabel ? loadingLabel : children;

    return (
      <Comp
        ref={ref}
        type={resolvedType}
        className={buttonVariants({
          variant,
          size,
          shape,
          fullWidth,
          className: cn(asChild && isDisabled ? "pointer-events-none opacity-50" : null, className)
        })}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={asChild ? isDisabled : undefined}
        aria-busy={loading}
        data-variant={variant}
        data-size={size}
        data-shape={shape}
        data-loading={loading ? "true" : "false"}
        {...props}
      >
        {loading ? <ButtonSpinner /> : leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
        {content}
        {!loading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
      </Comp>
    );
  }
);
Button.displayName = "Button";
