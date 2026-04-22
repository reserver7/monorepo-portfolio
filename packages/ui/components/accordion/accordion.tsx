"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import {
  ACCORDION_CONTENT_INNER_SIZE_CLASS,
  ACCORDION_DEFAULTS,
  ACCORDION_ITEM_VARIANT_CLASS,
  ACCORDION_TRIGGER_SIZE_CLASS
} from "./accordion.constants";
import { useAccordionStyle } from "./accordion.hooks";
import { AccordionStyleProvider } from "./accordion.utils";
import type { AccordionContentProps, AccordionItemProps, AccordionProps, AccordionTriggerProps } from "./accordion.types";

const AccordionComponent = ({
  size = ACCORDION_DEFAULTS.size,
  variant = ACCORDION_DEFAULTS.variant,
  chevronPosition = ACCORDION_DEFAULTS.chevronPosition,
  rotateChevron = ACCORDION_DEFAULTS.rotateChevron,
  ...props
}: AccordionProps) => {
  const resolvedSize = resolveOption(size, ACCORDION_TRIGGER_SIZE_CLASS, ACCORDION_DEFAULTS.size);
  const resolvedVariant = resolveOption(variant, ACCORDION_ITEM_VARIANT_CLASS, ACCORDION_DEFAULTS.variant);
  const resolvedChevronPosition = resolveOption(
    chevronPosition,
    { left: true, right: true },
    ACCORDION_DEFAULTS.chevronPosition
  );
  return (
    <AccordionStyleProvider value={{ size: resolvedSize, variant: resolvedVariant, chevronPosition: resolvedChevronPosition, rotateChevron }}>
      <AccordionPrimitive.Root {...props} />
    </AccordionStyleProvider>
  );
};
export const Accordion = React.memo(AccordionComponent);
Accordion.displayName = "Accordion";

const AccordionItemComponent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, variant, ...props }, ref) => {
  const context = useAccordionStyle();
  const resolvedVariant = resolveOption(variant ?? context.variant, ACCORDION_ITEM_VARIANT_CLASS, ACCORDION_DEFAULTS.variant);

  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn(ACCORDION_ITEM_VARIANT_CLASS[resolvedVariant], className)}
      {...props}
    />
  );
});
AccordionItemComponent.displayName = "AccordionItem";

export const AccordionItem = React.memo(AccordionItemComponent);
AccordionItem.displayName = "AccordionItem";

const AccordionTriggerComponent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(
  (
    {
      className,
      children,
      inset,
      chevronPosition,
      rotateChevron,
      hideChevron,
      leftSlot,
      rightSlot,
      ...props
    },
    ref
  ) => {
    const context = useAccordionStyle();
    const resolvedChevronPosition = resolveOption(
      chevronPosition ?? context.chevronPosition,
      { left: true, right: true },
      ACCORDION_DEFAULTS.chevronPosition
    );
    const shouldRotateChevron = rotateChevron ?? context.rotateChevron;

    const chevronNode = hideChevron ? null : (
      <ChevronDown
        className={cn(
          "h-[var(--size-icon-md)] w-[var(--size-icon-md)] shrink-0 text-muted transition-transform duration-200",
          shouldRotateChevron ? "group-data-[state=open]:rotate-180" : null
        )}
      />
    );

    return (
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cn(
            "group hover:text-primary flex flex-1 items-center gap-2 text-left font-medium outline-none transition-colors",
            ACCORDION_TRIGGER_SIZE_CLASS[resolveOption(context.size, ACCORDION_TRIGGER_SIZE_CLASS, ACCORDION_DEFAULTS.size)],
            inset ? "pl-8" : null,
            className
          )}
          {...props}
        >
          {resolvedChevronPosition === "left" ? chevronNode : null}
          {leftSlot ? <span className="inline-flex h-[var(--size-icon-md)] w-[var(--size-icon-md)] items-center justify-center text-muted">{leftSlot}</span> : null}
          <span className="min-w-0 flex-1 truncate">{children}</span>
          {rightSlot ? <span className="ml-auto inline-flex items-center text-muted">{rightSlot}</span> : null}
          {resolvedChevronPosition === "right" ? chevronNode : null}
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
    );
  }
);
AccordionTriggerComponent.displayName = AccordionPrimitive.Trigger.displayName;

export const AccordionTrigger = React.memo(AccordionTriggerComponent);
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContentComponent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, children, noPadding = false, ...props }, ref) => {
  const context = useAccordionStyle();
  const resolvedSize = resolveOption(context.size, ACCORDION_CONTENT_INNER_SIZE_CLASS, ACCORDION_DEFAULTS.size);

  return (
    <AccordionPrimitive.Content ref={ref} className={cn("overflow-hidden", className)} {...props}>
      <div className={cn("text-muted", noPadding ? null : ACCORDION_CONTENT_INNER_SIZE_CLASS[resolvedSize])}>{children}</div>
    </AccordionPrimitive.Content>
  );
});
AccordionContentComponent.displayName = AccordionPrimitive.Content.displayName;

export const AccordionContent = React.memo(AccordionContentComponent);
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
