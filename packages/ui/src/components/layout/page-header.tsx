import * as React from "react";
import { cn } from "../../lib/utils";
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}
function PageHeader({ heading, description, actions, className, ...props }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "border-default flex flex-wrap items-start justify-between gap-3 border-b pb-4",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <h1 className="text-foreground text-xl font-semibold">{heading}</h1>
        {description ? <p className="text-muted mt-1 text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
export { PageHeader };
