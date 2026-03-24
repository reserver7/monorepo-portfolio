import * as React from "react";
import { ButtonVariantProps, buttonVariants, useButtonClassName } from "../hooks/use-button";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    const resolvedClassName = useButtonClassName({ variant, size, className });
    return <button className={resolvedClassName} ref={ref} {...props} />;
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
