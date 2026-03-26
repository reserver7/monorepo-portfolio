import * as React from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader } from "../layout/card";
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: React.ReactNode;
}
function StatCard({ label, value, hint, icon, trend, className, ...props }: StatCardProps) {
  return (
    <Card className={cn("h-full", className)} {...props}>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide"> {label} </p>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-foreground text-2xl font-semibold tracking-tight"> {value} </p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        {trend ? <div className="pt-1 text-xs font-medium">{trend}</div> : null}
      </CardContent>
    </Card>
  );
}
export { StatCard };
