import type * as React from "react";
import type * as AccordionPrimitive from "@radix-ui/react-accordion";

export type AccordionSize = "sm" | "md" | "lg";
export type AccordionVariant = "default" | "separated" | "contained";
export type AccordionChevronPosition = "left" | "right";

type AccordionRootProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;

export type AccordionProps = AccordionRootProps & {
  size?: AccordionSize;
  variant?: AccordionVariant;
  chevronPosition?: AccordionChevronPosition;
  rotateChevron?: boolean;
};

export interface AccordionItemProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  variant?: AccordionVariant;
}

export interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  inset?: boolean;
  chevronPosition?: AccordionChevronPosition;
  rotateChevron?: boolean;
  hideChevron?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export interface AccordionContentProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {
  noPadding?: boolean;
}
