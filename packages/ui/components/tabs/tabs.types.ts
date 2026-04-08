import * as TabsPrimitive from "@radix-ui/react-tabs";

export type TabsSize = "sm" | "md" | "lg";
export type TabsVariant = "pill" | "underline";

export interface TabsListProps extends TabsPrimitive.TabsListProps {
  size?: TabsSize;
  variant?: TabsVariant;
  fullWidth?: boolean;
}

export interface TabsTriggerProps extends TabsPrimitive.TabsTriggerProps {
  size?: TabsSize;
  variant?: TabsVariant;
}
