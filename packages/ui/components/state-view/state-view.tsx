"use client";

import * as React from "react";
import { cn } from "../cn";
import {
  STATE_VIEW_DESCRIPTION_SIZE_CLASS,
  STATE_VIEW_DEFAULTS,
  STATE_VIEW_ICON_SIZE_CLASS,
  STATE_VIEW_LAYOUT_CLASS,
  STATE_VIEW_SIZE_CLASS,
  STATE_VIEW_TITLE_SIZE_CLASS,
  STATE_VIEW_VARIANT_MAP
} from "./state-view.constants";
import type { StateViewProps } from "./state-view.types";

export const StateView = React.memo(function StateView({
  variant = STATE_VIEW_DEFAULTS.variant,
  size = STATE_VIEW_DEFAULTS.size,
  align = STATE_VIEW_DEFAULTS.align,
  layout = STATE_VIEW_DEFAULTS.layout,
  title,
  description,
  className,
  action,
  icon
}: StateViewProps) {
  const variantConfig = STATE_VIEW_VARIANT_MAP[variant];
  const Icon = variantConfig.icon;
  const isInline = layout === "inline";
  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "rounded-xl border",
        variantConfig.box,
        variantConfig.border,
        STATE_VIEW_SIZE_CLASS[size],
        className
      )}
    >
      <div
        className={cn(
          STATE_VIEW_LAYOUT_CLASS[layout],
          isCenter ? "items-center text-center" : "items-start text-left",
          isInline ? (isCenter ? "justify-center" : "justify-start") : null
        )}
      >
        {icon ?? (
          <Icon
            className={cn(
              "shrink-0",
              isInline && !isCenter ? "mt-0.5" : null,
              STATE_VIEW_ICON_SIZE_CLASS[size],
              variantConfig.text,
              variant === "loading" && "animate-spin"
            )}
          />
        )}
        <div className={cn(isInline ? "min-w-0 flex-1" : "w-full")}>
          <p className={cn("font-semibold text-foreground", STATE_VIEW_TITLE_SIZE_CLASS[size])}>{title}</p>
          {description ? (
            <p className={cn("mt-1 text-muted", STATE_VIEW_DESCRIPTION_SIZE_CLASS[size])}>{description}</p>
          ) : null}
          {action ? <div className="mt-2">{action}</div> : null}
        </div>
      </div>
    </div>
  );
});
StateView.displayName = "StateView";
