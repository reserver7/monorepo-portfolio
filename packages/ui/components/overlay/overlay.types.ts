import * as React from "react";

export interface PopconfirmProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  onCancel?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okType?: "primary" | "danger" | "default";
  showCancel?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export interface TourStep {
  title: React.ReactNode;
  description?: React.ReactNode;
  target?: string | HTMLElement | (() => HTMLElement | null);
  placement?: "top" | "right" | "bottom" | "left";
}

export interface TourProps {
  steps: TourStep[];
  open?: boolean;
  defaultOpen?: boolean;
  current?: number;
  defaultCurrent?: number;
  onChange?: (current: number) => void;
  onClose?: () => void;
  nextText?: React.ReactNode;
  prevText?: React.ReactNode;
  finishText?: React.ReactNode;
  mask?: boolean;
  closable?: boolean;
  className?: string;
}

export interface FloatButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  description?: React.ReactNode;
  shape?: "circle" | "square";
  badge?: React.ReactNode;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export interface DrawerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  open?: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  placement?: "top" | "right" | "bottom" | "left";
  width?: number | string;
  height?: number | string;
  closable?: boolean;
  mask?: boolean;
  children?: React.ReactNode;
}
