"use client";

import * as React from "react";
import { FLEX_DEFAULTS } from "./flex.constants";
import { getFlexClassName } from "./flex.utils";
import type { FlexProps } from "./flex.types";

const FlexBase = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      className,
      direction = FLEX_DEFAULTS.direction,
      align = FLEX_DEFAULTS.align,
      justify = FLEX_DEFAULTS.justify,
      wrap = FLEX_DEFAULTS.wrap,
      gap = FLEX_DEFAULTS.gap,
      inline = FLEX_DEFAULTS.inline,
      fullWidth = FLEX_DEFAULTS.fullWidth,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={getFlexClassName({ direction, align, justify, wrap, gap, inline, fullWidth, className })}
      {...props}
    />
  )
);

FlexBase.displayName = "FlexBase";

export const Flex = React.memo(FlexBase);
Flex.displayName = "Flex";

