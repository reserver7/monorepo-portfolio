"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { resolveUiColorValue } from "../../styles/color-token";
import {
  AVATAR_DEFAULTS,
  AVATAR_FALLBACK_COLOR_CLASS,
  AVATAR_SHAPE_CLASS,
  AVATAR_SIZE_CLASS,
  AVATAR_STATUS_COLOR_CLASS,
  AVATAR_STATUS_SIZE_CLASS
} from "./avatar.constants";
import { getInitials } from "./avatar.utils";
import type { AvatarFallbackProps, AvatarImageProps, AvatarProps, AvatarStatusIndicatorProps } from "./avatar.types";

export const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("h-full w-full object-cover", className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, style, color = AVATAR_DEFAULTS.color, ...props }, ref) => {
  type AvatarFallbackPresetColor = keyof typeof AVATAR_FALLBACK_COLOR_CLASS;
  const hasPresetColor = Object.prototype.hasOwnProperty.call(AVATAR_FALLBACK_COLOR_CLASS, color);
  const resolvedColor: AvatarFallbackPresetColor = hasPresetColor
    ? (color as AvatarFallbackPresetColor)
    : AVATAR_DEFAULTS.color;
  const tokenColorValue = hasPresetColor ? undefined : resolveUiColorValue(color);

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center font-medium uppercase",
        AVATAR_FALLBACK_COLOR_CLASS[resolvedColor],
        className
      )}
      style={
        tokenColorValue
          ? {
              ...(style ?? {}),
              backgroundColor: `color-mix(in srgb, ${tokenColorValue} 14%, transparent)`,
              color: tokenColorValue
            }
          : style
      }
      {...props}
    />
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export const AvatarStatusIndicator = React.memo(function AvatarStatusIndicator({
  className,
  status = AVATAR_DEFAULTS.status,
  size = AVATAR_DEFAULTS.size,
  ...props
}: AvatarStatusIndicatorProps) {
  const resolvedStatus = resolveOption(status, AVATAR_STATUS_COLOR_CLASS, AVATAR_DEFAULTS.status);
  const resolvedSize = resolveOption(size, AVATAR_STATUS_SIZE_CLASS, AVATAR_DEFAULTS.size);
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 rounded-full ring-2 ring-surface",
        AVATAR_STATUS_SIZE_CLASS[resolvedSize],
        AVATAR_STATUS_COLOR_CLASS[resolvedStatus],
        className
      )}
      {...props}
    />
  );
});
AvatarStatusIndicator.displayName = "AvatarStatusIndicator";

const AvatarComponent = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  (
    {
      className,
      children,
      src,
      alt,
      name,
      fallbackText,
      delayMs,
      size = AVATAR_DEFAULTS.size,
      shape = AVATAR_DEFAULTS.shape,
      color = AVATAR_DEFAULTS.color,
      status = AVATAR_DEFAULTS.status,
      showStatus = AVATAR_DEFAULTS.showStatus,
      bordered = AVATAR_DEFAULTS.bordered,
      interactive = AVATAR_DEFAULTS.interactive,
      ...props
    },
    ref
  ) => {
    const resolvedSize = resolveOption(size, AVATAR_SIZE_CLASS, AVATAR_DEFAULTS.size);
    const resolvedShape = resolveOption(shape, AVATAR_SHAPE_CLASS, AVATAR_DEFAULTS.shape);
    const resolvedStatus = resolveOption(status, AVATAR_STATUS_COLOR_CLASS, AVATAR_DEFAULTS.status);
    const shouldRenderComposedChildren = React.Children.count(children) > 0;

    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden",
          AVATAR_SIZE_CLASS[resolvedSize],
          AVATAR_SHAPE_CLASS[resolvedShape],
          bordered ? "ring-1 ring-border" : null,
          interactive ? "cursor-pointer transition hover:brightness-95 active:brightness-90" : null,
          className
        )}
        {...props}
      >
        {shouldRenderComposedChildren ? (
          children
        ) : (
          <>
            {src ? <AvatarImage src={src} alt={alt ?? name ?? "avatar"} /> : null}
            <AvatarFallback delayMs={delayMs} color={color}>
              {getInitials(name, fallbackText)}
            </AvatarFallback>
          </>
        )}
        {showStatus ? <AvatarStatusIndicator status={resolvedStatus} size={resolvedSize} /> : null}
      </AvatarPrimitive.Root>
    );
  }
);
AvatarComponent.displayName = AvatarPrimitive.Root.displayName;

export const Avatar = React.memo(AvatarComponent);
Avatar.displayName = AvatarPrimitive.Root.displayName;
