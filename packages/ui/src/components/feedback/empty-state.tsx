import * as React from "react";
import { cn } from "../../lib/utils";
export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}
const DefaultEmptyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden
  >
    <path d="M4 7h16" /> <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    <path d="M19 7v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7" /> <path d="M10 11v6" /> <path d="M14 11v6" />
  </svg>
);
function EmptyState({ title, description, icon, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-default bg-surface-elevated flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center",
        className
      )}
      {...props}
    >
      <div className="border-default bg-surface text-muted-foreground rounded-full border p-2">
        {icon ?? <DefaultEmptyIcon />}
      </div>
      <div className="space-y-1">
        <p className="text-foreground text-sm font-semibold">{title}</p>
        {description ? <p className="text-muted text-xs">{description}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
export { EmptyState };
