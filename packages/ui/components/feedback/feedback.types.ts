import * as React from "react";

export type AlertType = "success" | "info" | "warning" | "error";
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AlertType;
  message: React.ReactNode;
  description?: React.ReactNode;
  showIcon?: boolean;
  closable?: boolean;
  closeText?: React.ReactNode;
  onClose?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  action?: React.ReactNode;
}

export interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}

export interface ResultProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  status?: "success" | "error" | "info" | "warning" | "404" | "403" | "500";
  title: React.ReactNode;
  subTitle?: React.ReactNode;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
}
