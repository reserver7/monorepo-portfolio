"use client";

import { Card, CardContent, CardHeader, CardTitle, Typography, chartColorTokens } from "@repo/ui";
import { useQuery } from "@repo/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getDashboardSummary } from "@/lib/api";
import { OpsSectionCard } from "@/components/opslens";
import { useOpsFilterStore } from "@/lib/store";
import { formatNumber } from "@/lib/utils";

const severityColors: Record<string, string> = chartColorTokens.severity;

export default function DashboardPage() {
  const environment = useOpsFilterStore((state) => state.environment);
  const serviceName = useOpsFilterStore((state) => state.serviceName);
  const search = useOpsFilterStore((state) => state.search);
  const from = useOpsFilterStore((state) => state.from);
  const to = useOpsFilterStore((state) => state.to);

  const summaryQuery = useQuery({
    queryKey: ["opslens", "dashboard", environment, serviceName, search, from, to],
    queryFn: () => getDashboardSummary({ environment, serviceName, query: search, from, to })
  });

  if (summaryQuery.isLoading) {
    return <Card className="border-default bg-surface rounded-xl p-6">대시보드 데이터를 불러오는 중...</Card>;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <Card className="border-danger/30 bg-danger/10 text-danger rounded-xl p-6">
        대시보드 조회에 실패했습니다.
      </Card>
    );
  }

  const summary = summaryQuery.data;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="오늘 발생 이슈" value={formatNumber(summary.todayIssueCount)} />
        <StatCard
          title="Critical"
          value={formatNumber(
            summary.severityDistribution.find((item) => item.severity === "critical")?.count ?? 0
          )}
          tone="danger"
        />
        <StatCard
          title="반복 에러 TOP 수"
          value={formatNumber(summary.topRepeatedErrors.length)}
          tone="warning"
        />
        <StatCard
          title="배포 후 신규 에러"
          value={formatNumber(summary.newAfterLatestDeployment.length)}
          tone="info"
        />
      </section>

      <OpsSectionCard title="AI 요약 브리핑">
        <p className="text-muted whitespace-pre-wrap text-sm leading-6">{summary.aiBriefing}</p>
      </OpsSectionCard>

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="심각도 분포">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={summary.severityDistribution}
                dataKey="count"
                nameKey="severity"
                outerRadius={80}
                label
              >
                {summary.severityDistribution.map((entry) => (
                  <Cell
                    key={entry.severity}
                    fill={severityColors[entry.severity] ?? chartColorTokens.fallback}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="최근 24시간 에러 추이">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={summary.errorTrend24h}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke={chartColorTokens.trend}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="가장 많이 반복된 에러 TOP 5">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary.topRepeatedErrors} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="title" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={chartColorTokens.bar} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="최근 배포 이후 신규 증가 에러">
          {summary.newAfterLatestDeployment.length === 0 ? (
            <p className="text-muted text-sm">신규 증가 이슈가 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {summary.newAfterLatestDeployment.map((issue) => (
                <li key={issue.issueId} className="border-default rounded-lg border p-3">
                  <p className="text-foreground text-sm font-semibold">{issue.title}</p>
                  <p className="text-muted mt-1 text-xs">
                    심각도: {issue.severity} · 횟수: {formatNumber(issue.count)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  tone = "default"
}: {
  title: string;
  value: string;
  tone?: "default" | "danger" | "warning" | "info";
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger/30 bg-danger/10"
      : tone === "warning"
        ? "border-warning/30 bg-warning/10"
        : tone === "info"
          ? "border-primary/30 bg-primary/10"
          : "border-default bg-surface";

  return (
    <Card className={`rounded-2xl p-4 shadow-sm ${toneClass}`}>
      <CardHeader className="space-y-0 p-0">
        <CardTitle className="text-muted text-xs uppercase tracking-[0.12em]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-3">
        <Typography as="p" variant="display" className="text-3xl">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-default bg-surface rounded-2xl p-5 shadow-sm">
      <CardHeader className="mb-4 p-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}
