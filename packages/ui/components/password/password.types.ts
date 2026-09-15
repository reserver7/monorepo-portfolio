import type * as React from "react";
import type { InputProps } from "../input/input.types";

export interface PasswordProps extends Omit<InputProps, "type" | "suffix"> {
  visibilityToggle?: boolean | { visible?: boolean; onVisibleChange?: (visible: boolean) => void };
  iconRender?: (visible: boolean) => React.ReactNode;
}
