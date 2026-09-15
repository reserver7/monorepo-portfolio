import type * as React from "react";

export type ComponentSize = "small" | "middle" | "large";
export type ComponentStatus = "default" | "success" | "warning" | "error" | "info" | "validating";
export type ComponentVariant = "outlined" | "filled" | "borderless" | "underlined";
export type ComponentPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight";

export type ControllableValue<T> = {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
};

export type ComponentStateProps = {
  disabled?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  status?: ComponentStatus;
};

export type ComponentInteractionProps = ComponentStateProps & {
  id?: string;
  name?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

export type SemanticSlots<T extends string = string> = Partial<Record<T, string>>;
export type SemanticStyles<T extends string = string> = Partial<Record<T, React.CSSProperties>>;
