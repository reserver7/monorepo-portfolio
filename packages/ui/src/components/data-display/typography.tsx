import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
const typographyVariants = cva("", {
  variants: {
    variant: {
      display: "font-heading text-display-2xl font-bold tracking-tight",
      h1: "font-heading text-display-xl font-semibold tracking-tight",
      h2: "font-heading text-heading-xl font-semibold tracking-tight",
      h3: "font-heading text-heading-lg font-semibold",
      lead: "text-body-lg text-muted",
      body: "text-body text-foreground",
      bodySm: "text-body-sm text-foreground",
      caption: "text-caption text-muted-foreground",
      code: "font-mono text-caption rounded border border-default bg-surface-elevated px-1.5 py-0.5 text-muted"
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted",
      subtle: "text-muted-foreground",
      success: "text-success",
      warning: "text-warning",
      danger: "text-danger"
    }
  },
  defaultVariants: { variant: "body", tone: "default" }
});
export type TypographyVariantProps = VariantProps<typeof typographyVariants>;
export interface TypographyProps extends React.HTMLAttributes<HTMLElement>, TypographyVariantProps {
  as?: React.ElementType;
}
function Typography({
  as: Component = "p",
  variant = "body",
  tone = "default",
  className,
  ...props
}: TypographyProps) {
  return <Component className={cn(typographyVariants({ variant, tone }), className)} {...props} />;
}
export { Typography, typographyVariants };
