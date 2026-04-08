"use client";

import * as React from "react";
import { cn } from "../cn";
import { CARD_DEFAULTS, CARD_SECTION_PADDING_CLASS } from "./card.constants";
import { resolveCardRootClassName } from "./card.utils";
import type { CardProps, CardSectionProps } from "./card.types";

export const Card = React.memo(function Card({
  className,
  variant = CARD_DEFAULTS.variant,
  interactive = CARD_DEFAULTS.interactive,
  padding = CARD_DEFAULTS.padding,
  radius = CARD_DEFAULTS.radius,
  bordered = CARD_DEFAULTS.bordered,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        resolveCardRootClassName({ variant, interactive, padding, radius, bordered }),
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

export const CardHeader = React.memo(function CardHeader({ className, padding = "lg", ...props }: CardSectionProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5", CARD_SECTION_PADDING_CLASS[padding], className)} {...props} />
  );
});
CardHeader.displayName = "CardHeader";

export const CardTitle = React.memo(function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-heading-md", className)} {...props} />;
});
CardTitle.displayName = "CardTitle";

export const CardDescription = React.memo(function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body-sm text-muted", className)} {...props} />;
});
CardDescription.displayName = "CardDescription";

export const CardContent = React.memo(function CardContent({ className, padding = "lg", ...props }: CardSectionProps) {
  return <div className={cn(CARD_SECTION_PADDING_CLASS[padding], className)} {...props} />;
});
CardContent.displayName = "CardContent";

export const CardFooter = React.memo(function CardFooter({ className, padding = "lg", ...props }: CardSectionProps) {
  return <div className={cn("flex items-center", CARD_SECTION_PADDING_CLASS[padding], className)} {...props} />;
});
CardFooter.displayName = "CardFooter";
