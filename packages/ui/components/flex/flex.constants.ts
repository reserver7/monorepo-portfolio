import type { FlexAlign, FlexDirection, FlexGap, FlexJustify, FlexWrap } from "./flex.types";

export const FLEX_DEFAULTS = {
  direction: "row" as FlexDirection,
  align: "stretch" as FlexAlign,
  justify: "start" as FlexJustify,
  wrap: "nowrap" as FlexWrap,
  gap: "none" as FlexGap,
  inline: false,
  fullWidth: false
};

export const FLEX_DIRECTION_CLASS: Record<FlexDirection, string> = {
  row: "flex-row",
  "row-reverse": "flex-row-reverse",
  col: "flex-col",
  "col-reverse": "flex-col-reverse"
};

export const FLEX_ALIGN_CLASS: Record<FlexAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline"
};

export const FLEX_JUSTIFY_CLASS: Record<FlexJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly"
};

export const FLEX_WRAP_CLASS: Record<FlexWrap, string> = {
  nowrap: "flex-nowrap",
  wrap: "flex-wrap",
  "wrap-reverse": "flex-wrap-reverse"
};

export const FLEX_GAP_CLASS: Record<FlexGap, string> = {
  none: "",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6"
};

