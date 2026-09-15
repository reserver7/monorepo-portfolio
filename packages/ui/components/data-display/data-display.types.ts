import * as React from "react";

export interface ListProps<T = unknown> extends React.HTMLAttributes<HTMLDivElement> {
  dataSource?: readonly T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  bordered?: boolean;
  split?: boolean;
  loading?: boolean;
  emptyText?: React.ReactNode;
}
export interface DescriptionItem {
  key?: React.Key;
  label: React.ReactNode;
  children: React.ReactNode;
  span?: number;
}
export interface DescriptionsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  items: readonly DescriptionItem[];
  title?: React.ReactNode;
  bordered?: boolean;
  column?: number;
  size?: "small" | "middle" | "default";
  layout?: "horizontal" | "vertical";
}
export interface StatisticProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "prefix"> {
  title: React.ReactNode;
  value?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  precision?: number;
  formatter?: (value: React.ReactNode) => React.ReactNode;
  loading?: boolean;
  valueStyle?: React.CSSProperties;
}
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: "default" | "success" | "processing" | "warning" | "error" | "info" | string;
  closable?: boolean;
  closeIcon?: React.ReactNode;
  onClose?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
export interface TimelineItem {
  key?: React.Key;
  color?:
    | "default"
    | "success"
    | "processing"
    | "warning"
    | "error"
    | "info"
    | "blue"
    | "red"
    | "green"
    | "gray";
  dot?: React.ReactNode;
  children: React.ReactNode;
  label?: React.ReactNode;
}
export interface TimelineProps extends React.HTMLAttributes<HTMLUListElement> {
  items: readonly TimelineItem[];
  mode?: "left" | "alternate" | "right";
  pending?: React.ReactNode;
  reverse?: boolean;
}
