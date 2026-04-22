import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, Typography } from "../components";
import { cn } from "../components/cn";

export type ConsoleSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ConsoleSectionCard({
  title,
  description,
  children,
  className,
  contentClassName
}: ConsoleSectionCardProps) {
  return (
    <Card
      variant="default"
      className={cn("border-default bg-surface rounded-2xl shadow-sm", className)}
    >
      <CardHeader className="space-y-[var(--space-1)] p-[var(--space-5)] pb-0 sm:p-[var(--space-6)] sm:pb-0">
        <Typography as="h2" variant="h3" className="text-title font-semibold leading-tight tracking-tight">
          {title}
        </Typography>
        {description ? (
          <Typography variant="bodySm" color="muted" className="leading-[var(--line-height-normal)]">
            {description}
          </Typography>
        ) : null}
      </CardHeader>
      <CardContent className={cn("p-[var(--space-5)] pt-[var(--space-4)] sm:p-[var(--space-6)] sm:pt-[var(--space-5)]", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function ConsolePageStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-[var(--stack-gap)]", className)}>{children}</div>;
}

export function ConsoleInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="muted" className="border-default bg-surface-elevated rounded-xl px-[var(--space-3)] py-[var(--space-2-5)] text-sm">
      <Typography as="p" variant="caption" color="subtle" className="font-semibold uppercase tracking-wide">
        {label}
      </Typography>
      <Typography as="p" variant="bodySm" className="mt-[var(--space-1)] font-medium">
        {value}
      </Typography>
    </Card>
  );
}
