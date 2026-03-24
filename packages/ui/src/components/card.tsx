import * as React from "react";
import {
  useCardClassName,
  useCardContentClassName,
  useCardDescriptionClassName,
  useCardFooterClassName,
  useCardHeaderClassName,
  useCardTitleClassName
} from "../hooks/use-card";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const resolvedClassName = useCardClassName(className);
    return <div ref={ref} className={resolvedClassName} {...props} />;
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const resolvedClassName = useCardHeaderClassName(className);
    return <div ref={ref} className={resolvedClassName} {...props} />;
  }
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const resolvedClassName = useCardTitleClassName(className);
    return <h3 ref={ref} className={resolvedClassName} {...props} />;
  }
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const resolvedClassName = useCardDescriptionClassName(className);
    return <p ref={ref} className={resolvedClassName} {...props} />;
  }
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const resolvedClassName = useCardContentClassName(className);
    return <div ref={ref} className={resolvedClassName} {...props} />;
  }
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const resolvedClassName = useCardFooterClassName(className);
    return <div ref={ref} className={resolvedClassName} {...props} />;
  }
);
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
