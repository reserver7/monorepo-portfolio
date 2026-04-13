import type { AccordionSize, AccordionVariant } from "./accordion.types";

export const ACCORDION_DEFAULTS = {
  size: "md" as AccordionSize,
  variant: "default" as AccordionVariant,
  chevronPosition: "right" as const,
  rotateChevron: true
};

export const ACCORDION_TRIGGER_SIZE_CLASS: Record<AccordionSize, string> = {
  sm: "min-h-9 px-3 py-2 text-body-sm",
  md: "min-h-10 px-4 py-2.5 text-body-sm",
  lg: "min-h-11 px-5 py-3 text-body-md"
};

export const ACCORDION_CONTENT_INNER_SIZE_CLASS: Record<AccordionSize, string> = {
  sm: "px-3 pb-3 pt-0 text-body-sm",
  md: "px-4 pb-4 pt-0 text-body-sm",
  lg: "px-5 pb-5 pt-0 text-body-md"
};

export const ACCORDION_ITEM_VARIANT_CLASS: Record<AccordionVariant, string> = {
  default: "border-default border-b",
  separated: "border-default mb-2 overflow-hidden rounded-[var(--radius-lg)] border last:mb-0",
  contained:
    "border-default border-x border-t first:rounded-t-[var(--radius-lg)] last:rounded-b-[var(--radius-lg)] last:border-b"
};
