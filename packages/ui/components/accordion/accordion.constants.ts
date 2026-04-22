import type { AccordionSize, AccordionVariant } from "./accordion.types";

export const ACCORDION_DEFAULTS = {
  size: "md" as AccordionSize,
  variant: "default" as AccordionVariant,
  chevronPosition: "right" as const,
  rotateChevron: true
};

export const ACCORDION_TRIGGER_SIZE_CLASS: Record<AccordionSize, string> = {
  sm: "min-h-[var(--size-control-md)] px-[var(--space-3)] py-[var(--space-2)] text-body-sm",
  md: "min-h-[var(--size-control-lg)] px-[var(--space-4)] py-[var(--space-2-5)] text-body-sm",
  lg: "min-h-[var(--size-control-xl)] px-[var(--space-5)] py-[var(--space-3)] text-body-md"
};

export const ACCORDION_CONTENT_INNER_SIZE_CLASS: Record<AccordionSize, string> = {
  sm: "px-[var(--space-3)] pb-[var(--space-3)] pt-0 text-body-sm",
  md: "px-[var(--space-4)] pb-[var(--space-4)] pt-0 text-body-sm",
  lg: "px-[var(--space-5)] pb-[var(--space-5)] pt-0 text-body-md"
};

export const ACCORDION_ITEM_VARIANT_CLASS: Record<AccordionVariant, string> = {
  default: "border-default border-b",
  separated: "border-default mb-[var(--space-2)] overflow-hidden rounded-[var(--radius-lg)] border last:mb-0",
  contained:
    "border-default border-x border-t first:rounded-t-[var(--radius-lg)] last:rounded-b-[var(--radius-lg)] last:border-b"
};
