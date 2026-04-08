import * as React from "react";

export type SpacingSize = "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type SpacingAxis = "vertical" | "horizontal" | "both";

export interface SpacingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpacingSize;
  axis?: SpacingAxis;
  responsive?: boolean;
}

