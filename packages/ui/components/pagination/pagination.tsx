"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { Button } from "../button";
import { PAGINATION_DEFAULTS, PAGINATION_SIZE_MAP, PAGINATION_VARIANT_MAP } from "./pagination.constants";
import type { PaginationProps } from "./pagination.types";
import { createPaginationItems, resolveTotalPages, toSafePage, toSafePageSize } from "./pagination.utils";

const PaginationBase = React.forwardRef(function PaginationBase(
  {
    className,
    page,
    defaultPage = PAGINATION_DEFAULTS.defaultPage,
    totalPages = PAGINATION_DEFAULTS.totalPages,
    totalItems = PAGINATION_DEFAULTS.totalItems,
    pageSize,
    defaultPageSize = PAGINATION_DEFAULTS.defaultPageSize,
    pageSizeOptions = PAGINATION_DEFAULTS.pageSizeOptions,
    onPageChange,
    onPageSizeChange,
    siblingCount = PAGINATION_DEFAULTS.siblingCount,
    boundaryCount = PAGINATION_DEFAULTS.boundaryCount,
    showFirstLast = PAGINATION_DEFAULTS.showFirstLast,
    showPrevNext = PAGINATION_DEFAULTS.showPrevNext,
    showTotal = PAGINATION_DEFAULTS.showTotal,
    showPageInfo = PAGINATION_DEFAULTS.showPageInfo,
    showPageSizeSelector = PAGINATION_DEFAULTS.showPageSizeSelector,
    showQuickJumper = PAGINATION_DEFAULTS.showQuickJumper,
    hideOnSinglePage = PAGINATION_DEFAULTS.hideOnSinglePage,
    simple = PAGINATION_DEFAULTS.simple,
    pageSizeLabel = PAGINATION_DEFAULTS.pageSizeLabel,
    pageSizeSuffix = PAGINATION_DEFAULTS.pageSizeSuffix,
    quickJumperPlaceholder = PAGINATION_DEFAULTS.quickJumperPlaceholder,
    quickJumperGoLabel = PAGINATION_DEFAULTS.quickJumperGoLabel,
    disabled = PAGINATION_DEFAULTS.disabled,
    size = PAGINATION_DEFAULTS.size,
    variant = PAGINATION_DEFAULTS.variant,
    itemStyle = PAGINATION_DEFAULTS.itemStyle,
    fullWidth = PAGINATION_DEFAULTS.fullWidth,
    ...props
  }: PaginationProps,
  ref: React.ForwardedRef<HTMLElement>
) {
    const isPageSizeControlled = pageSize !== undefined;
    const [internalPageSize, setInternalPageSize] = React.useState(() => toSafePageSize(defaultPageSize));
    const normalizedPageSizeOptions = React.useMemo(() => {
      if (Array.isArray(pageSizeOptions)) {
        return Array.from(new Set(pageSizeOptions.map((value) => toSafePageSize(Number(value))))).sort((a, b) => a - b);
      }
      if (typeof pageSizeOptions === "string") {
        try {
          const parsed = JSON.parse(pageSizeOptions) as unknown;
          if (Array.isArray(parsed)) {
            return Array.from(new Set(parsed.map((value) => toSafePageSize(Number(value))))).sort((a, b) => a - b);
          }
        } catch {
          return PAGINATION_DEFAULTS.pageSizeOptions;
        }
      }
      return PAGINATION_DEFAULTS.pageSizeOptions;
    }, [pageSizeOptions]);
    const resolvedPageSize = toSafePageSize(isPageSizeControlled ? pageSize : internalPageSize);
    const pageSizeSelectOptions = React.useMemo(() => {
      if (normalizedPageSizeOptions.includes(resolvedPageSize)) return normalizedPageSizeOptions;
      return [...normalizedPageSizeOptions, resolvedPageSize].sort((a, b) => a - b);
    }, [normalizedPageSizeOptions, resolvedPageSize]);
    const safeTotalPages = resolveTotalPages({ totalPages, totalItems, pageSize: resolvedPageSize });
    const isControlled = page !== undefined;
    const [internalPage, setInternalPage] = React.useState(() => toSafePage(defaultPage, safeTotalPages));
    const [quickJumpValue, setQuickJumpValue] = React.useState("");

    React.useEffect(() => {
      if (isControlled) return;
      setInternalPage(toSafePage(defaultPage, safeTotalPages));
    }, [defaultPage, isControlled, safeTotalPages]);

    React.useEffect(() => {
      if (isPageSizeControlled) return;
      setInternalPageSize(toSafePageSize(defaultPageSize));
    }, [defaultPageSize, isPageSizeControlled]);

    const currentPage = toSafePage(isControlled ? page : internalPage, safeTotalPages);
    const isNavDisabled = disabled || safeTotalPages <= 1;

    const selectPage = React.useCallback(
      (nextPage: number) => {
        if (isNavDisabled) return;
        const next = toSafePage(nextPage, safeTotalPages);
        if (!isControlled) setInternalPage(next);
        onPageChange?.(next);
      },
      [isControlled, isNavDisabled, onPageChange, safeTotalPages]
    );

    const changePageSize = React.useCallback(
      (nextPageSizeRaw: number) => {
        const nextPageSize = toSafePageSize(nextPageSizeRaw);
        if (!isPageSizeControlled) setInternalPageSize(nextPageSize);
        onPageSizeChange?.(nextPageSize);
        selectPage(1);
      },
      [isPageSizeControlled, onPageSizeChange, selectPage]
    );

    const items = React.useMemo(
      () => createPaginationItems({ page: currentPage, totalPages: safeTotalPages, siblingCount, boundaryCount }),
      [boundaryCount, currentPage, safeTotalPages, siblingCount]
    );

    const resolvedSize = resolveOption(size, PAGINATION_SIZE_MAP, PAGINATION_DEFAULTS.size);
    const resolvedVariant = resolveOption(variant, PAGINATION_VARIANT_MAP, PAGINATION_DEFAULTS.variant);
    const buttonSize = PAGINATION_SIZE_MAP[resolvedSize];
    const buttonVariant = PAGINATION_VARIANT_MAP[resolvedVariant];
    const paginationCellClass =
      resolvedSize === "sm"
        ? "h-[var(--size-control-sm)] min-w-[var(--size-control-sm)] px-[var(--space-2)] text-body-xs"
        : resolvedSize === "lg"
          ? "h-[var(--size-control-lg)] min-w-[var(--size-control-lg)] px-[var(--space-3)] text-body-md"
          : "h-[var(--size-control-md)] min-w-[var(--size-control-md)] px-[var(--space-2-5)] text-body-sm";
    const paginationIconButtonClass =
      resolvedSize === "sm"
        ? "h-[var(--size-control-sm)] w-[var(--size-control-sm)] p-0"
        : resolvedSize === "lg"
          ? "h-[var(--size-control-lg)] w-[var(--size-control-lg)] p-0"
          : "h-[var(--size-control-md)] w-[var(--size-control-md)] p-0";
    const paginationLabelClass =
      resolvedSize === "sm"
        ? "h-[var(--size-control-sm)] min-w-[var(--space-20)] text-body-xs"
        : resolvedSize === "lg"
          ? "h-[var(--size-control-lg)] min-w-[var(--space-24)] text-body-md"
          : "h-[var(--size-control-md)] min-w-[var(--space-20)] text-body-sm";
    const digitWidth = Math.max(2, String(safeTotalPages).length);
    const pageCellWidth = `calc(${digitWidth}ch + 1.25rem)`;
    const stableNumericStyle = React.useMemo(() => ({ fontVariantNumeric: "tabular-nums" as const }), []);
    const stableCellStyle = React.useMemo(() => ({ width: pageCellWidth, ...stableNumericStyle }), [pageCellWidth, stableNumericStyle]);
    const stableLabelStyle = React.useMemo(
      () => ({ minWidth: `calc(${digitWidth * 2 + 4}ch + 1rem)`, ...stableNumericStyle }),
      [digitWidth, stableNumericStyle]
    );
    const safeTotalItems = Math.max(0, Number(totalItems ?? 0));
    const from = safeTotalItems > 0 ? (currentPage - 1) * resolvedPageSize + 1 : 0;
    const to = safeTotalItems > 0 ? Math.min(currentPage * resolvedPageSize, safeTotalItems) : 0;
    const totalText =
      typeof showTotal === "function"
        ? showTotal({ from, to, total: safeTotalItems, page: currentPage, pageSize: resolvedPageSize })
        : `${from}-${to} / ${safeTotalItems}`;
    const hasTools = showPageSizeSelector || showQuickJumper || showPageInfo || Boolean(showTotal);
    if (hideOnSinglePage && safeTotalPages <= 1) return null;
    const isMinimalItemStyle = itemStyle === "minimal";

    const renderIconControl = React.useCallback(
      ({
        ariaLabel,
        disabled: controlDisabled,
        onClick,
        icon
      }: {
        ariaLabel: string;
        disabled: boolean;
        onClick: () => void;
        icon: React.ReactNode;
      }) =>
        isMinimalItemStyle ? (
          <button
            type="button"
            aria-label={ariaLabel}
            disabled={controlDisabled}
            onClick={onClick}
            className={cn(
              "inline-flex items-center justify-center text-muted transition-colors",
              paginationIconButtonClass,
              controlDisabled ? "opacity-40" : "hover:text-foreground"
            )}
            style={stableCellStyle}
          >
            {icon}
          </button>
        ) : (
          <Button
            variant="ghost"
            size={buttonSize}
            leftIcon={icon}
            iconOnly
            className={paginationIconButtonClass}
            style={stableCellStyle}
            disabled={controlDisabled}
            onClick={onClick}
            aria-label={ariaLabel}
          />
        ),
      [isMinimalItemStyle, paginationIconButtonClass, stableCellStyle, buttonSize]
    );

    const renderPageControl = React.useCallback(
      (value: number) =>
        isMinimalItemStyle ? (
          <button
            type="button"
            key={value}
            className={cn(
              "inline-flex items-center justify-center rounded-[var(--radius-md)] px-2 font-medium transition-colors",
              paginationCellClass,
              value === currentPage
                ? "ring-primary/35 bg-primary/12 text-primary ring-1 font-semibold"
                : "text-muted hover:bg-surface-elevated hover:text-foreground"
            )}
            style={stableCellStyle}
            disabled={isNavDisabled}
            onClick={() => selectPage(value)}
            aria-current={value === currentPage ? "page" : undefined}
          >
            {value}
          </button>
        ) : (
          <Button
            key={value}
            variant={value === currentPage ? "primary" : buttonVariant}
            size={buttonSize}
            className={paginationCellClass}
            style={stableCellStyle}
            disabled={isNavDisabled}
            onClick={() => selectPage(value)}
            aria-current={value === currentPage ? "page" : undefined}
          >
            {value}
          </Button>
        ),
      [isMinimalItemStyle, paginationCellClass, stableCellStyle, isNavDisabled, selectPage, currentPage, buttonVariant, buttonSize]
    );

    return (
      <nav
        ref={ref}
        className={cn(
          "flex flex-col gap-[var(--space-2)]",
          fullWidth ? "w-full" : "w-fit max-w-full",
          fullWidth ? null : "sm:flex-row sm:items-center sm:justify-between",
          className
        )}
        aria-label="Pagination"
        {...props}
      >
        <div className={cn("flex items-center gap-[var(--space-1)]", fullWidth ? "w-full flex-wrap justify-center" : "flex-wrap")} style={stableNumericStyle}>
          {showFirstLast ? (
            renderIconControl({
              ariaLabel: "첫 페이지",
              disabled: isNavDisabled || currentPage <= 1,
              onClick: () => selectPage(1),
              icon: <ChevronsLeft className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />
            })
          ) : null}

          {showPrevNext ? (
            renderIconControl({
              ariaLabel: "이전 페이지",
              disabled: isNavDisabled || currentPage <= 1,
              onClick: () => selectPage(currentPage - 1),
              icon: <ChevronLeft className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />
            })
          ) : null}

          {simple ? (
            <span
              className={cn(
              "inline-flex items-center justify-center rounded-[var(--radius-md)] border border-default bg-surface px-[var(--space-3)] font-medium text-foreground",
                paginationLabelClass
              )}
              style={stableLabelStyle}
            >
              {currentPage} / {safeTotalPages}
            </span>
          ) : (
            items.map((item) =>
              item.type === "ellipsis" ? (
                <span
                  key={item.key}
                  className={cn("text-muted inline-flex items-center justify-center", paginationCellClass)}
                  style={stableCellStyle}
                >
                  <MoreHorizontal className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />
                </span>
              ) : (
                renderPageControl(item.value)
              )
            )
          )}

          {showPrevNext ? (
            renderIconControl({
              ariaLabel: "다음 페이지",
              disabled: isNavDisabled || currentPage >= safeTotalPages,
              onClick: () => selectPage(currentPage + 1),
              icon: <ChevronRight className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />
            })
          ) : null}

          {showFirstLast ? (
            renderIconControl({
              ariaLabel: "마지막 페이지",
              disabled: isNavDisabled || currentPage >= safeTotalPages,
              onClick: () => selectPage(safeTotalPages),
              icon: <ChevronsRight className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />
            })
          ) : null}
        </div>

        {hasTools ? (
          <div
            className={cn(
              "flex flex-wrap items-center gap-[var(--space-2)] text-body-sm text-muted",
              fullWidth ? "justify-center" : "sm:justify-end"
            )}
          >
            {showTotal ? <span>{totalText}</span> : null}
            {showPageInfo ? (
              <span>
                {currentPage} / {safeTotalPages}
              </span>
            ) : null}
            {showPageSizeSelector ? (
              <label className="inline-flex items-center gap-[var(--space-1)]">
                <span>{pageSizeLabel}</span>
                <select
                  className="h-[var(--size-control-sm)] rounded-[var(--radius-md)] border border-default bg-surface px-[var(--space-2)] text-body-sm text-foreground"
                  value={resolvedPageSize}
                  disabled={disabled}
                  onChange={(event) => changePageSize(Number(event.target.value))}
                >
                  {pageSizeSelectOptions.map((optionValue) => (
                    <option key={optionValue} value={optionValue}>
                      {optionValue}
                    </option>
                  ))}
                </select>
                {pageSizeSuffix ? <span>{pageSizeSuffix}</span> : null}
              </label>
            ) : null}
            {showQuickJumper ? (
              <div className="inline-flex items-center gap-[var(--space-1)]">
                <input
                  className="h-[var(--size-control-sm)] w-[var(--space-16)] rounded-[var(--radius-md)] border border-default bg-surface px-[var(--space-2)] text-body-sm text-foreground"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quickJumpValue}
                  placeholder={quickJumperPlaceholder}
                  onChange={(event) => setQuickJumpValue(event.target.value.replace(/[^\d]/g, ""))}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    const next = Number(quickJumpValue);
                    if (!Number.isNaN(next) && next > 0) selectPage(next);
                    setQuickJumpValue("");
                  }}
                />
                <Button
                  variant="outline"
                  size={buttonSize}
                  onClick={() => {
                    const next = Number(quickJumpValue);
                    if (!Number.isNaN(next) && next > 0) selectPage(next);
                    setQuickJumpValue("");
                  }}
                >
                  {quickJumperGoLabel}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </nav>
    );
});

PaginationBase.displayName = "PaginationBase";

export const Pagination = React.memo(PaginationBase);
Pagination.displayName = "Pagination";
