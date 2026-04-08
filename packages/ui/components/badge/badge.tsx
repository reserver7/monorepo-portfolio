"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../cn";
import { BADGE_DEFAULTS, BADGE_DOT_SIZE_CLASS } from "./badge.constants";
import { getBadgeRootClassName } from "./badge.utils";
import type { BadgeProps } from "./badge.types";

const BadgeComponent = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      style,
      variant = BADGE_DEFAULTS.variant,
      size = BADGE_DEFAULTS.size,
      shape = BADGE_DEFAULTS.shape,
      leftSlot,
      rightSlot,
      dot = BADGE_DEFAULTS.dot,
      pulse = BADGE_DEFAULTS.pulse,
      interactive = BADGE_DEFAULTS.interactive,
      truncate = BADGE_DEFAULTS.truncate,
      maxWidth,
      removable = BADGE_DEFAULTS.removable,
      removeLabel = BADGE_DEFAULTS.removeLabel,
      onRemove,
      children,
      ...props
    },
    ref
  ) => {
    const [dismissed, setDismissed] = React.useState(false);
    const hasRemoveAction = removable;

    React.useEffect(() => {
      if (!removable) {
        setDismissed(false);
      }
    }, [removable]);

    if (dismissed) {
      return null;
    }

    return (
      <span
        ref={ref}
        className={getBadgeRootClassName({ variant, size, shape, interactive, truncate, className })}
        style={{
          ...(style ?? {}),
          ...(maxWidth != null ? { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth } : {})
        }}
        {...props}
      >
        {dot ? (
          <span
            aria-hidden
            className={cn(
              "shrink-0 rounded-full bg-current",
              BADGE_DOT_SIZE_CLASS[size],
              pulse ? "animate-pulse" : null
            )}
          />
        ) : null}

        {leftSlot ? <span className="inline-flex shrink-0 items-center">{leftSlot}</span> : null}

        <span className={cn("min-w-0", truncate ? "truncate" : null)}>{children}</span>

        {rightSlot ? <span className="inline-flex shrink-0 items-center">{rightSlot}</span> : null}

        {hasRemoveAction ? (
          <button
            type="button"
            aria-label={removeLabel}
            className="ml-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full opacity-80 transition hover:bg-black/10 hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              if (typeof onRemove === "function") {
                onRemove();
                return;
              }
              setDismissed(true);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </span>
    );
  }
);
BadgeComponent.displayName = "Badge";

export const Badge = React.memo(BadgeComponent);
Badge.displayName = "Badge";
