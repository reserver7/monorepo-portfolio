import * as React from "react";

export type PaginationSize = "sm" | "md" | "lg";
export type PaginationVariant = "default" | "outline" | "ghost";
export type PaginationItemStyle = "button" | "minimal";

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  page?: number;
  defaultPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  defaultPageSize?: number;
  pageSizeOptions?: readonly number[] | string;
  onPageChange?: (nextPage: number) => void;
  onPageSizeChange?: (nextPageSize: number) => void;
  siblingCount?: number;
  boundaryCount?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  showTotal?: boolean | ((params: { from: number; to: number; total: number; page: number; pageSize: number }) => React.ReactNode);
  showPageInfo?: boolean;
  showPageSizeSelector?: boolean;
  showQuickJumper?: boolean;
  hideOnSinglePage?: boolean;
  simple?: boolean;
  pageSizeLabel?: string;
  pageSizeSuffix?: string;
  quickJumperPlaceholder?: string;
  quickJumperGoLabel?: string;
  disabled?: boolean;
  size?: PaginationSize;
  variant?: PaginationVariant;
  itemStyle?: PaginationItemStyle;
  fullWidth?: boolean;
}
