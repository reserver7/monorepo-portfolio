"use client";

import * as React from "react";
import { cn } from "../cn";
import { STAT_CARD_COLOR_CLASS, STAT_CARD_DEFAULTS, STAT_CARD_SIZE_CLASS } from "./stat-card.constants";
import type { StatCardProps } from "./stat-card.types";

export const StatCard = React.memo(function StatCard({
  label,
  value,
  helper,
  color = STAT_CARD_DEFAULTS.color,
  size = STAT_CARD_DEFAULTS.size,
  className
}: StatCardProps) {
  return (
    <div className={cn("rounded-xl border", STAT_CARD_COLOR_CLASS[color], STAT_CARD_SIZE_CLASS[size], className)}>
      <p className="text-muted text-xs font-medium">{label}</p>
      <p className="text-foreground mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {helper ? <p className="text-muted mt-1 text-xs">{helper}</p> : null}
    </div>
  );
});
StatCard.displayName = "StatCard";
