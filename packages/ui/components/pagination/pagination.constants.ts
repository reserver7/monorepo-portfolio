import type { PaginationItemStyle, PaginationSize, PaginationVariant } from "./pagination.types";

export const PAGINATION_DEFAULTS = {
  defaultPage: 1,
  totalPages: 10,
  totalItems: undefined as number | undefined,
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
  siblingCount: 1,
  boundaryCount: 1,
  showFirstLast: true,
  showPrevNext: true,
  showTotal: false,
  showPageInfo: false,
  showPageSizeSelector: false,
  showQuickJumper: false,
  hideOnSinglePage: false,
  simple: false,
  pageSizeLabel: "페이지당",
  pageSizeSuffix: "개",
  quickJumperPlaceholder: "페이지",
  quickJumperGoLabel: "이동",
  disabled: false,
  size: "md" as PaginationSize,
  variant: "outline" as PaginationVariant,
  itemStyle: "minimal" as PaginationItemStyle,
  fullWidth: false
};

export const PAGINATION_SIZE_MAP: Record<PaginationSize, "sm" | "md" | "lg"> = {
  sm: "sm",
  md: "md",
  lg: "lg"
};

export const PAGINATION_VARIANT_MAP: Record<PaginationVariant, "secondary" | "outline" | "ghost"> = {
  default: "secondary",
  outline: "outline",
  ghost: "ghost"
};
