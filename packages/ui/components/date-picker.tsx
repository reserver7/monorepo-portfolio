"use client";

import * as React from "react";
import { Input, type InputProps } from "./input";

export type DatePickerProps = Omit<InputProps, "type">;

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>((props, ref) => {
  return <Input ref={ref} type="date" {...props} />;
});
DatePicker.displayName = "DatePicker";
