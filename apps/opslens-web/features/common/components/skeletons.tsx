"use client";

import { Box, Card, CardContent, CardHeader, Grid, Skeleton } from "@repo/ui";
import { OpsPageShell } from "./primitives";

export function OpsDashboardSkeleton() {
  return (
    <OpsPageShell>
      <Grid className="justify-items-stretch gap-[var(--space-4)] md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={`dashboard-stat-skeleton-${index}`}
            className="border-default bg-surface rounded-2xl p-[var(--space-4)] shadow-sm"
          >
            <CardHeader className="space-y-[var(--space-2)] p-0">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-24" />
            </CardHeader>
          </Card>
        ))}
      </Grid>

      <Card className="border-default bg-surface rounded-2xl p-[var(--space-5)] shadow-sm">
        <CardHeader className="space-y-[var(--space-2)] p-0">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-3/5" />
        </CardHeader>
        <CardContent className="space-y-[var(--space-2)] p-0 pt-[var(--space-4)]">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-8/12" />
        </CardContent>
      </Card>

      <Grid className="justify-items-stretch gap-[var(--space-6)] lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={`dashboard-chart-skeleton-${index}`}
            className="border-default bg-surface rounded-2xl p-[var(--space-5)] shadow-sm"
          >
            <CardHeader className="space-y-[var(--space-2)] p-0">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="p-0 pt-[var(--space-4)]">
              <Skeleton className="h-56 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </Grid>
    </OpsPageShell>
  );
}

export function OpsIssueDetailSkeleton() {
  return (
    <OpsPageShell>
      <Card className="border-default bg-surface rounded-2xl p-[var(--space-5)] shadow-sm">
        <CardHeader className="space-y-[var(--space-3)] p-0">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-4/5" />
        </CardHeader>
        <CardContent className="grid gap-[var(--space-3)] p-0 pt-[var(--space-5)] md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={`issue-info-skeleton-${index}`} className="h-[68px] w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>

      <Grid className="justify-items-stretch gap-[var(--space-6)] xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card
            key={`issue-main-skeleton-${index}`}
            className="border-default bg-surface rounded-2xl p-[var(--space-5)] shadow-sm"
          >
            <CardHeader className="space-y-[var(--space-2)] p-0">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-[var(--space-2)] p-0 pt-[var(--space-4)]">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-8/12" />
            </CardContent>
          </Card>
        ))}
      </Grid>
    </OpsPageShell>
  );
}

export function OpsCardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Box className="space-y-[var(--space-2)]">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={`ops-list-skeleton-${index}`} className="border-default bg-surface rounded-lg p-[var(--space-3)]">
          <CardContent className="space-y-[var(--space-2)] p-0">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
