import * as React from "react";
import { useInputClassName } from "../hooks/use-input";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const resolvedClassName = useInputClassName(className);

  return (
    <input
      type={type}
      className={resolvedClassName}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
