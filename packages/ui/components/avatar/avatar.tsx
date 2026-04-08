"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../cn";
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
>(({ className, color = AVATAR_DEFAULTS.color, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center font-medium uppercase",
      AVATAR_FALLBACK_COLOR_CLASS[color],
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export const AvatarStatusIndicator = React.memo(function AvatarStatusIndicator({
  className,
  status = AVATAR_DEFAULTS.status,
  size = AVATAR_DEFAULTS.size,
  ...props
}: AvatarStatusIndicatorProps) {
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 rounded-full ring-2 ring-surface",
        AVATAR_STATUS_SIZE_CLASS[size],
        AVATAR_STATUS_COLOR_CLASS[status],
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
    const shouldRenderComposedChildren = React.Children.count(children) > 0;

    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden",
          AVATAR_SIZE_CLASS[size],
          AVATAR_SHAPE_CLASS[shape],
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
        {showStatus ? <AvatarStatusIndicator status={status} size={size} /> : null}
      </AvatarPrimitive.Root>
    );
  }
);
AvatarComponent.displayName = AvatarPrimitive.Root.displayName;

export const Avatar = React.memo(AvatarComponent);
Avatar.displayName = AvatarPrimitive.Root.displayName;
