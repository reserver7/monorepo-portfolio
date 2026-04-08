import { useMemo } from "react";
import { TYPOGRAPHY_COLOR_CLASS_MAP, TYPOGRAPHY_VARIANT_CLASS_MAP } from "./typography.constants";
import type { TypographyColor, TypographyVariant } from "./typography.types";

export const useTypographyClasses = (variant: TypographyVariant, color: TypographyColor) => {
  return useMemo(
    () => `${TYPOGRAPHY_VARIANT_CLASS_MAP[variant]} ${TYPOGRAPHY_COLOR_CLASS_MAP[color]}`,
    [variant, color]
  );
};
