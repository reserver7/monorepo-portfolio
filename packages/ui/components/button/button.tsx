"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import {
  BUTTON_DEFAULTS,
  BUTTON_ICON_ONLY_SIZE_CLASS,
  BUTTON_SHAPE_CLASS,
  BUTTON_SIZE_CLASS,
  BUTTON_VARIANT_CLASS
} from "./button.constants";
import { useButtonDisabledState } from "./button.hooks";
import type { ButtonProps, ButtonVariantsInput } from "./button.types";

const isDevelopmentRuntime = () => {
  if (typeof process === "undefined" || !process.env) {
    return false;
  }
  return process.env.NODE_ENV !== "production";
};

export const buttonVariants = ({
  variant = BUTTON_DEFAULTS.variant,
  size = BUTTON_DEFAULTS.size,
  shape = BUTTON_DEFAULTS.shape,
  iconOnly = false,
  fullWidth = BUTTON_DEFAULTS.fullWidth,
  className
}: ButtonVariantsInput) => {
  const resolvedVariant = resolveOption(variant, BUTTON_VARIANT_CLASS, BUTTON_DEFAULTS.variant);
  const resolvedSize = resolveOption(size, BUTTON_SIZE_CLASS, BUTTON_DEFAULTS.size);
  const resolvedShape = resolveOption(shape, BUTTON_SHAPE_CLASS, BUTTON_DEFAULTS.shape);
  return cn(
    "inline-flex items-center justify-center gap-2 font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50",
    BUTTON_VARIANT_CLASS[resolvedVariant],
    iconOnly ? BUTTON_ICON_ONLY_SIZE_CLASS[resolvedSize] : BUTTON_SIZE_CLASS[resolvedSize],
    BUTTON_SHAPE_CLASS[resolvedShape],
    fullWidth && !iconOnly ? "w-full" : "w-auto",
    className
  );
};

const ButtonSpinner = React.memo(function ButtonSpinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
});
ButtonSpinner.displayName = "ButtonSpinner";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      loading = false,
      loadingLabel,
      variant = BUTTON_DEFAULTS.variant,
      size = BUTTON_DEFAULTS.size,
      shape = BUTTON_DEFAULTS.shape,
      iconOnly = false,
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
    const content = iconOnly ? null : loading && loadingLabel ? loadingLabel : children;
    const hasIcon = Boolean(leftIcon || rightIcon);
    const hasAsChildDecorators = loading || leftIcon || rightIcon || iconOnly;
    const asChildContent = React.useMemo(() => {
      if (React.isValidElement(children)) {
        return children;
      }
      return <span>{children}</span>;
    }, [children]);
    const computedClassName = React.useMemo(
      () =>
        buttonVariants({
          variant,
          size,
          shape,
          iconOnly,
          fullWidth,
          className: cn(asChild && isDisabled ? "pointer-events-none opacity-50" : null, className)
        }),
      [asChild, className, fullWidth, iconOnly, isDisabled, shape, size, variant]
    );

    if (isDevelopmentRuntime() && iconOnly && !hasIcon) {
      console.warn("[Button] `iconOnly` 버튼에는 `leftIcon` 또는 `rightIcon`이 필요합니다.");
    }
    if (isDevelopmentRuntime() && asChild && hasAsChildDecorators) {
      console.warn("[Button] `asChild` 사용 시 loading/iconOnly/leftIcon/rightIcon은 무시됩니다.");
    }

    return (
      <Comp
        ref={ref}
        type={resolvedType}
        className={computedClassName}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={asChild ? isDisabled : undefined}
        aria-busy={loading}
        data-variant={variant}
        data-size={size}
        data-shape={shape}
        data-icon-only={iconOnly ? "true" : "false"}
        data-loading={loading ? "true" : "false"}
        {...props}
      >
        {asChild ? (
          asChildContent
        ) : (
          <>
            {loading ? <ButtonSpinner /> : leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
            {content}
            {!loading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";
