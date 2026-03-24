import * as React from "react";
import { useTextareaClassName } from "../hooks/use-textarea";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  const resolvedClassName = useTextareaClassName(className);

  return (
    <textarea
      className={resolvedClassName}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
