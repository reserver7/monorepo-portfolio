"use client";

import * as React from "react";
import { SPACING_DEFAULTS } from "./spacing.constants";
import type { SpacingProps } from "./spacing.types";
import { getSpacingClassName } from "./spacing.utils";

const SpacingBase = React.forwardRef<HTMLDivElement, SpacingProps>(
  (
    {
      className,
      size = SPACING_DEFAULTS.size,
      axis = SPACING_DEFAULTS.axis,
      responsive = SPACING_DEFAULTS.responsive,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={getSpacingClassName({ size, axis, responsive, className })}
      {...props}
    />
  )
);

SpacingBase.displayName = "SpacingBase";

export const Spacing = React.memo(SpacingBase);
Spacing.displayName = "Spacing";

