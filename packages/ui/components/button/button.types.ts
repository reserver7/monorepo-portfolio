import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "text" | "link";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "default" | "rounded" | "pill" | "square";

export interface ButtonVariantsInput {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  iconOnly?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  iconOnly?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
