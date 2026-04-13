import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import type { RegisterOptions } from "react-hook-form";
import type { UiColorToken } from "../../styles/color-token";

export type SwitchSize = "sm" | "md";
export type SwitchColor = "primary" | "success" | "warning" | "danger" | UiColorToken;

export interface SwitchProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>, "onCheckedChange"> {
  size?: SwitchSize;
  color?: SwitchColor;
  loading?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export interface SwitchFieldProps extends SwitchProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  helperText?: React.ReactNode;
  errorMessage?: React.ReactNode;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  helperClassName?: string;
  control?: unknown;
  rules?: RegisterOptions;
}
