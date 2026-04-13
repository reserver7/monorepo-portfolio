import type * as React from "react";
import type * as AvatarPrimitive from "@radix-ui/react-avatar";
import type { UiColorToken } from "../../styles/color-token";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "rounded" | "square";
export type AvatarColor = "default" | "primary" | "success" | "warning" | "danger" | UiColorToken;
export type AvatarStatus = "online" | "offline" | "away" | "busy";

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string;
  alt?: string;
  name?: string;
  fallbackText?: string;
  delayMs?: number;
  size?: AvatarSize;
  shape?: AvatarShape;
  color?: AvatarColor;
  status?: AvatarStatus;
  showStatus?: boolean;
  bordered?: boolean;
  interactive?: boolean;
}

export type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;

export interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {
  color?: AvatarColor;
}

export interface AvatarStatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: AvatarStatus;
  size?: AvatarSize;
}
