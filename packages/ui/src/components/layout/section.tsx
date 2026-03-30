import * as React from "react";
import { cn } from "../../lib/utils";
export type SectionProps = React.HTMLAttributes<HTMLElement>;
function Section({ className, ...props }: SectionProps) {
  return <section className={cn("space-y-4", className)} {...props} />;
}
export interface SectionHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}
function SectionHeader({ title, description, actions, className, children, ...props }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)} {...props}>
      <div className="space-y-1">
        {title ? <h2 className="text-foreground text-lg font-semibold">{title}</h2> : null}
        {description ? <p className="text-muted text-sm">{description}</p> : null} {children}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
function SectionBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3", className)} {...props} />;
}
export { Section, SectionBody, SectionHeader };
