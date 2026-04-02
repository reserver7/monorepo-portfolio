"use client";

import dynamic from "next/dynamic";
import { StatCard, StateView } from "@repo/ui";
import { useQuery } from "@repo/react-query";
import { getDashboardSummary } from "@/features/ops/api";
import { OpsDashboardSkeleton, OpsSectionCard, SeverityBadge } from "@/features/ops";
import { useOpsFilters } from "@/features/ops/stores";
import { formatNumber } from "@/lib/utils";
import { opslensQueryKeys, toOptionalSearch, toOptionalServiceName } from "@/features/ops/api";

const SeverityDistributionChart = dynamic(
  () => import("@/features/ops/components/dashboard-charts").then((mod) => mod.SeverityDistributionChart),
  { ssr: false }
);
const ErrorTrendChart = dynamic(
  () => import("@/features/ops/components/dashboard-charts").then((mod) => mod.ErrorTrendChart),
  { ssr: false }
);
const TopRepeatedErrorsChart = dynamic(
  () => import("@/features/ops/components/dashboard-charts").then((mod) => mod.TopRepeatedErrorsChart),
  { ssr: false }
);

export default function DashboardPage() {
  const { environment, serviceName, search, from, to } = useOpsFilters();
  const filter = { environment, serviceName, search, from, to };

  const summaryQuery = useQuery({
    queryKey: opslensQueryKeys.dashboard(filter),
    staleTime: 10 * 1000,
    queryFn: () =>
      getDashboardSummary({
        environment,
        serviceName: toOptionalServiceName(serviceName),
        query: toOptionalSearch(search),
        from,
        to
      })
  });

  if (summaryQuery.isLoading) {
    return <OpsDashboardSkeleton />;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return <StateView variant="error" size="lg" title="대시보드 조회에 실패했습니다." />;
  }

  const summary = summaryQuery.data;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="오늘 발생 이슈" value={formatNumber(summary.todayIssueCount)} size="lg" />
        <StatCard
          label="Critical"
          value={formatNumber(
            summary.severityDistribution.find((item) => item.severity === "critical")?.count ?? 0
          )}
          tone="danger"
          size="lg"
        />
        <StatCard
          label="반복 에러 TOP 수"
          value={formatNumber(summary.topRepeatedErrors.length)}
          tone="warning"
          size="lg"
        />
        <StatCard
          label="배포 후 신규 에러"
          value={formatNumber(summary.newAfterLatestDeployment.length)}
          tone="primary"
          size="lg"
        />
      </section>

      <OpsSectionCard title="AI 요약 브리핑">
        <p className="text-muted whitespace-pre-wrap text-sm leading-6">{summary.aiBriefing}</p>
      </OpsSectionCard>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="심각도 분포">
          <SeverityDistributionChart summary={summary} />
        </ChartCard>

        <ChartCard title="최근 24시간 에러 추이">
          <ErrorTrendChart summary={summary} />
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="가장 많이 반복된 에러 TOP 5">
          <TopRepeatedErrorsChart summary={summary} />
        </ChartCard>

        <ChartCard title="최근 배포 이후 신규 증가 에러">
          {summary.newAfterLatestDeployment.length === 0 ? (
            <StateView variant="empty" size="sm" title="신규 증가 이슈가 없습니다." />
          ) : (
            <ul className="space-y-3">
              {summary.newAfterLatestDeployment.map((issue) => (
                <li key={issue.issueId} className="border-default rounded-lg border p-3">
                  <p className="text-foreground text-sm font-semibold">{issue.title}</p>
                  <div className="text-muted mt-1 flex items-center gap-2 text-xs">
                    <SeverityBadge severity={issue.severity} />
                    <span>횟수: {formatNumber(issue.count)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </section>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <OpsSectionCard title={title} contentClassName="pt-4">
      {children}
    </OpsSectionCard>
  );
}
