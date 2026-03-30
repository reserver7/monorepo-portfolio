import * as React from "react";
import { cn } from "../../lib/utils";
import { Label } from "./label";
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  description?: React.ReactNode;
  error?: React.ReactNode;
}
function FormField({
  label,
  htmlFor,
  required = false,
  description,
  error,
  className,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)} {...props}>
      {label ? (
        <Label htmlFor={htmlFor} className="text-sm">
          {label} {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </Label>
      ) : null}
      {children} {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
      {error ? <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  );
}
function FormActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)} {...props} />;
}
export { FormActions, FormField };
