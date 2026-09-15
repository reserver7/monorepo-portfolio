import type * as React from "react";

export type TransferItem = { key: string; title: React.ReactNode; disabled?: boolean };
export interface TransferProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  dataSource: readonly TransferItem[];
  targetKeys?: readonly string[];
  defaultTargetKeys?: readonly string[];
  onChange?: (targetKeys: string[], direction: "left" | "right", movedKeys: string[]) => void;
  showSearch?: boolean;
  filterOption?: (input: string, item: TransferItem) => boolean;
  titles?: readonly [React.ReactNode, React.ReactNode];
  operations?: readonly [React.ReactNode, React.ReactNode];
  oneWay?: boolean;
  disabled?: boolean;
  loading?: boolean;
  notFoundContent?: React.ReactNode;
  emptyContent?: React.ReactNode;
}
