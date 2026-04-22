import * as React from "react";
import { Button, type ButtonProps } from "../components";
import { cn } from "../components/cn";

type MarketingGlassNavAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: ButtonProps["variant"];
};

export type MarketingGlassNavProps = {
  product: string;
  subtitle?: string;
  actions?: MarketingGlassNavAction[];
  rightSlot?: React.ReactNode;
  className?: string;
};

export function MarketingGlassNav({ product, subtitle, actions = [], rightSlot, className }: MarketingGlassNavProps) {
  const navigateByHref = (href: string) => {
    if (typeof window === "undefined") {
      return;
    }
    window.location.assign(href);
  };

  return (
    <header className={cn("marketing-nav-glass sticky top-0 z-40 mb-6", className)}>
      <div className="mx-auto flex h-14 w-full max-w-[1360px] items-center justify-between px-4 md:px-8">
        <div className="min-w-0">
          <p className="text-foreground truncate text-body-sm font-semibold">{product}</p>
          {subtitle ? <p className="text-micro text-muted-foreground truncate">{subtitle}</p> : null}
        </div>
        {actions.length > 0 || rightSlot ? (
          <div className="flex items-center gap-2">
            {rightSlot}
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? "outline"}
                size="sm"
                onClick={() => {
                  if (action.onClick) {
                    action.onClick();
                    return;
                  }
                  if (action.href) {
                    navigateByHref(action.href);
                  }
                }}
                className={action.variant ? undefined : "rounded-xl"}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export type MarketingSectionProps = React.HTMLAttributes<HTMLElement> & {
  tone?: "light" | "dark";
};

export function MarketingSection({ tone = "light", className, ...props }: MarketingSectionProps) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-xl)] px-4 py-6 md:px-6 md:py-8",
        tone === "dark" ? "section-dark" : "section-light border-default border",
        className
      )}
      {...props}
    />
  );
}

export type MarketingCtaPairProps = {
  learnMoreLabel?: string;
  primaryLabel: string;
  onLearnMoreClick?: () => void;
  onPrimaryClick?: () => void;
  primaryLoading?: boolean;
  className?: string;
};

export function MarketingCtaPair({
  learnMoreLabel = "Learn more",
  primaryLabel,
  onLearnMoreClick,
  onPrimaryClick,
  primaryLoading = false,
  className
}: MarketingCtaPairProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button variant="outline" shape="pill" size="md" onClick={onLearnMoreClick}>
        {learnMoreLabel}
      </Button>
      <Button variant="primary" shape="pill" size="md" onClick={onPrimaryClick} loading={primaryLoading}>
        {primaryLabel}
      </Button>
    </div>
  );
}
