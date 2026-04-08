"use client";

import * as React from "react";
import { BOX_DEFAULTS } from "./box.constants";
import { getBoxClassName } from "./box.utils";
import type { BoxProps } from "./box.types";

const BoxBase = React.forwardRef<HTMLDivElement, BoxProps>(
  (
    {
      className,
      variant = BOX_DEFAULTS.variant,
      padding = BOX_DEFAULTS.padding,
      radius = BOX_DEFAULTS.radius,
      shadow = BOX_DEFAULTS.shadow,
      border = BOX_DEFAULTS.border,
      fullWidth = BOX_DEFAULTS.fullWidth,
      fullHeight = BOX_DEFAULTS.fullHeight,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={getBoxClassName({ variant, padding, radius, shadow, border, fullWidth, fullHeight, className })}
      {...props}
    />
  )
);

BoxBase.displayName = "BoxBase";

export const Box = React.memo(BoxBase);
Box.displayName = "Box";

