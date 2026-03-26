import * as React from "react";
import { Input } from "./input";
export type DatePickerProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(({ className, ...props }, ref) => {
  return <Input ref={ref} type="date" className={className} {...props} />;
});
DatePicker.displayName = "DatePicker";
export { DatePicker };
