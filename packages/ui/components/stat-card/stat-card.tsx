"use client";

import * as React from "react";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { resolveUiColorValue } from "../../styles/color-token";
import { STAT_CARD_COLOR_CLASS, STAT_CARD_DEFAULTS, STAT_CARD_SIZE_CLASS } from "./stat-card.constants";
import type { StatCardProps } from "./stat-card.types";

export const StatCard = React.memo(function StatCard({
  label,
  value,
  helper,
  color = STAT_CARD_DEFAULTS.color,
  size = STAT_CARD_DEFAULTS.size,
  className,
  style
}: StatCardProps) {
  const hasPresetColor = Object.prototype.hasOwnProperty.call(STAT_CARD_COLOR_CLASS, color);
  const resolvedColor = hasPresetColor
    ? resolveOption(color as keyof typeof STAT_CARD_COLOR_CLASS, STAT_CARD_COLOR_CLASS, STAT_CARD_DEFAULTS.color)
    : STAT_CARD_DEFAULTS.color;
  const tokenColorValue = hasPresetColor ? undefined : resolveUiColorValue(color);
  const resolvedSize = resolveOption(size, STAT_CARD_SIZE_CLASS, STAT_CARD_DEFAULTS.size);

  return (
    <div
      className={cn("rounded-[var(--radius-xl)] border", STAT_CARD_COLOR_CLASS[resolvedColor], STAT_CARD_SIZE_CLASS[resolvedSize], className)}
      style={{
        ...(tokenColorValue
          ? {
              borderColor: `color-mix(in srgb, ${tokenColorValue} 35%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${tokenColorValue} 10%, transparent)`
            }
          : {}),
        ...(style ?? {})
      }}
    >
      <p className="text-muted text-xs font-medium">{label}</p>
      <p className="text-foreground mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {helper ? <p className="text-muted mt-1 text-xs">{helper}</p> : null}
    </div>
  );
});
StatCard.displayName = "StatCard";
