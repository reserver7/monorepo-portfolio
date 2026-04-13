"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import {
  TABS_DEFAULTS,
  TABS_LIST_SIZE_CLASS,
  TABS_LIST_VARIANT_CLASS,
  TABS_TRIGGER_SIZE_CLASS,
  TABS_TRIGGER_VARIANT_CLASS
} from "./tabs.constants";
import type { TabsListProps, TabsTriggerProps } from "./tabs.types";

const Tabs = TabsPrimitive.Root;

const TabsListComponent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  (
    {
      className,
      size = TABS_DEFAULTS.size,
      variant = TABS_DEFAULTS.variant,
      fullWidth = TABS_DEFAULTS.fullWidth,
      ...props
    },
    ref
  ) => {
    const resolvedSize = resolveOption(size, TABS_LIST_SIZE_CLASS, TABS_DEFAULTS.size);
    const resolvedVariant = resolveOption(variant, TABS_LIST_VARIANT_CLASS, TABS_DEFAULTS.variant);
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          TABS_LIST_SIZE_CLASS[resolvedSize],
          TABS_LIST_VARIANT_CLASS[resolvedVariant],
          fullWidth && "w-full justify-stretch",
          className
        )}
        {...props}
      />
    );
  }
);
TabsListComponent.displayName = TabsPrimitive.List.displayName;

const TabsList = React.memo(TabsListComponent);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTriggerComponent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
  ({ className, size = TABS_DEFAULTS.size, variant = TABS_DEFAULTS.variant, ...props }, ref) => {
    const resolvedSize = resolveOption(size, TABS_TRIGGER_SIZE_CLASS, TABS_DEFAULTS.size);
    const resolvedVariant = resolveOption(variant, TABS_TRIGGER_VARIANT_CLASS, TABS_DEFAULTS.variant);
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          "ring-offset-surface focus-visible:ring-primary inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2",
          TABS_TRIGGER_SIZE_CLASS[resolvedSize],
          TABS_TRIGGER_VARIANT_CLASS[resolvedVariant],
          className
        )}
        {...props}
      />
    );
  }
);
TabsTriggerComponent.displayName = TabsPrimitive.Trigger.displayName;

const TabsTrigger = React.memo(TabsTriggerComponent);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContentComponent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => <TabsPrimitive.Content ref={ref} className={cn("mt-2", className)} {...props} />);
TabsContentComponent.displayName = TabsPrimitive.Content.displayName;

const TabsContent = React.memo(TabsContentComponent);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
