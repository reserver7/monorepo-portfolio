import * as React from "react";

export type TableDensity = "compact" | "default" | "comfortable";

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
  containerRef?: React.Ref<HTMLDivElement>;
  stickyHeader?: boolean;
  density?: TableDensity;
  striped?: boolean;
  hoverable?: boolean;
}
