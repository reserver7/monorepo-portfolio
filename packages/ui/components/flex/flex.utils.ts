import { cn } from "../cn";
import {
  FLEX_ALIGN_CLASS,
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

  return cn(
    inline ? "inline-flex" : "flex",
    FLEX_DIRECTION_CLASS[direction],
    FLEX_ALIGN_CLASS[align],
    FLEX_JUSTIFY_CLASS[justify],
    FLEX_WRAP_CLASS[wrap],
    FLEX_GAP_CLASS[gap],
    fullWidth ? "w-full" : null,
    className
  );
};

