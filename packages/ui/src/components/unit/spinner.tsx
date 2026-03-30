import * as React from "react";
import { cn } from "../../lib/utils";
export type SpinnerProps = React.SVGProps<SVGSVGElement>;
const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(({ className, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-4 w-4 animate-spin text-current", className)}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" className="opacity-20" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
});
Spinner.displayName = "Spinner";
export { Spinner };
