export type SpinnerSize = "sm" | "md" | "lg";
export type SpinnerColor = "default" | "primary" | "danger" | "success" | "warning";

export interface SpinnerProps {
  open?: boolean;
  fullscreen?: boolean;
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
  className?: string;
  delayMs?: number;
}
