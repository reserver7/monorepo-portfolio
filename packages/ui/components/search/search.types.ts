import type * as React from "react";
import type { InputProps } from "../input/input.types";

export interface SearchProps extends Omit<InputProps, "type" | "suffix"> {
  enterButton?: boolean | React.ReactNode;
  loading?: boolean;
  onSearch?: (value: string, event?: React.SyntheticEvent<HTMLInputElement>) => void;
  onPressEnter?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}
