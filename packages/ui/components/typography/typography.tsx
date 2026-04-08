"use client";

import * as React from "react";
import { cn } from "../cn";
import { TYPOGRAPHY_DEFAULTS } from "./typography.constants";
import { useTypographyClasses } from "./typography.hooks";
import type { TypographyProps } from "./typography.types";

export const Typography = React.memo(function Typography({
  as = TYPOGRAPHY_DEFAULTS.as,
  variant = TYPOGRAPHY_DEFAULTS.variant,
  color = TYPOGRAPHY_DEFAULTS.color,
  className,
  ...props
}: TypographyProps) {
  const Comp = as as React.ElementType;
  const typographyClasses = useTypographyClasses(variant, color);
  return <Comp className={cn(typographyClasses, className)} {...props} />;
});
Typography.displayName = "Typography";
