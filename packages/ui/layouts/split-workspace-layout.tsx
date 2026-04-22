import type { ReactNode } from "react";
import { cn } from "../components/cn";

export interface SplitWorkspaceLayoutProps {
  main: ReactNode;
  sidebar: ReactNode;
  className?: string;
  mainClassName?: string;
  sidebarClassName?: string;
  sidebarWidthClassName?: string;
  stickySidebar?: boolean;
}

export const SplitWorkspaceLayout = ({
  main,
  sidebar,
  className,
  mainClassName,
  sidebarClassName,
  sidebarWidthClassName = "lg:grid-cols-[minmax(0,1fr)_392px]",
  stickySidebar = true
}: SplitWorkspaceLayoutProps) => {
  return (
    <div className={cn("grid items-start gap-[var(--layout-section-gap)]", sidebarWidthClassName, className)}>
      <section className={cn("min-w-0", mainClassName)}>{main}</section>
      <aside
        className={cn(
          "min-w-0 space-y-[var(--space-4)]",
          stickySidebar && "lg:sticky lg:top-[var(--space-6)] lg:self-start",
          sidebarClassName
        )}
      >
        {sidebar}
      </aside>
    </div>
  );
};
