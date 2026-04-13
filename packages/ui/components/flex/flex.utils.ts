import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import {
  FLEX_ALIGN_CLASS,
  FLEX_DEFAULTS,
  FLEX_DIRECTION_CLASS,
  FLEX_GAP_CLASS,
  FLEX_JUSTIFY_CLASS,
  FLEX_WRAP_CLASS
} from "./flex.constants";
import type { FlexAlign, FlexDirection, FlexGap, FlexJustify, FlexWrap } from "./flex.types";

export const getFlexClassName = (params: {
  direction: FlexDirection;
  align: FlexAlign;
  justify: FlexJustify;
  wrap: FlexWrap;
  gap: FlexGap;
  inline: boolean;
  fullWidth: boolean;
  className?: string;
}) => {
  const { direction, align, justify, wrap, gap, inline, fullWidth, className } = params;
  const resolvedDirection = resolveOption(direction, FLEX_DIRECTION_CLASS, FLEX_DEFAULTS.direction);
  const resolvedAlign = resolveOption(align, FLEX_ALIGN_CLASS, FLEX_DEFAULTS.align);
  const resolvedJustify = resolveOption(justify, FLEX_JUSTIFY_CLASS, FLEX_DEFAULTS.justify);
  const resolvedWrap = resolveOption(wrap, FLEX_WRAP_CLASS, FLEX_DEFAULTS.wrap);
  const resolvedGap = resolveOption(gap, FLEX_GAP_CLASS, FLEX_DEFAULTS.gap);

  return cn(
    inline ? "inline-flex" : "flex",
    FLEX_DIRECTION_CLASS[resolvedDirection],
    FLEX_ALIGN_CLASS[resolvedAlign],
    FLEX_JUSTIFY_CLASS[resolvedJustify],
    FLEX_WRAP_CLASS[resolvedWrap],
    FLEX_GAP_CLASS[resolvedGap],
    fullWidth ? "w-full" : null,
    className
  );
};
