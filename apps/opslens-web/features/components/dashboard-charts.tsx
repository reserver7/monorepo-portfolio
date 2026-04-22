"use client";

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
import { Box, chartColorTokens } from "@repo/ui";
import type { DashboardSummary } from "@repo/opslens";

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "rgb(var(--color-bg-surface))",
    border: "1px solid rgb(var(--color-border-default))",
    borderRadius: 12
  },
  labelStyle: { color: "rgb(var(--color-fg-default))", fontWeight: 600 },
  itemStyle: { color: "rgb(var(--color-fg-default))" }
} as const;

const severityColors: Record<string, string> = chartColorTokens.severity;

type Summary = Pick<DashboardSummary, "severityDistribution" | "errorTrend24h" | "topRepeatedErrors">;

export function SeverityDistributionChart({ summary }: { summary: Summary }) {
  return (
    <Box
      role="img"
      aria-label="심각도별 이슈 분포 파이 차트"
      className="[&_.recharts-wrapper:focus]:outline-none [&_.recharts-surface:focus]:outline-none [&_.recharts-sector:focus]:outline-none [&_[tabindex]:focus]:outline-none"
    >
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={summary.severityDistribution} dataKey="count" nameKey="severity" outerRadius={80} label rootTabIndex={-1}>
            {summary.severityDistribution.map((entry) => (
              <Cell key={entry.severity} fill={severityColors[entry.severity] ?? chartColorTokens.fallback} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function ErrorTrendChart({ summary }: { summary: Summary }) {
  return (
    <Box
      role="img"
      aria-label="최근 24시간 에러 추이 선 그래프"
      className="[&_.recharts-wrapper:focus]:outline-none [&_.recharts-surface:focus]:outline-none [&_.recharts-sector:focus]:outline-none [&_[tabindex]:focus]:outline-none"
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={summary.errorTrend24h}>
          <CartesianGrid stroke="rgb(var(--color-border-default) / 0.8)" strokeDasharray="3 3" />
          <XAxis dataKey="hour" tick={{ fill: "rgb(var(--color-fg-muted))", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "rgb(var(--color-fg-muted))", fontSize: 12 }} />
          <Tooltip {...tooltipStyle} />
          <Line type="monotone" dataKey="count" stroke={chartColorTokens.trend} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function TopRepeatedErrorsChart({ summary }: { summary: Summary }) {
  return (
    <Box
      role="img"
      aria-label="반복 에러 상위 5개 막대 그래프"
      className="[&_.recharts-wrapper:focus]:outline-none [&_.recharts-surface:focus]:outline-none [&_.recharts-sector:focus]:outline-none [&_[tabindex]:focus]:outline-none"
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={summary.topRepeatedErrors} layout="vertical">
          <CartesianGrid stroke="rgb(var(--color-border-default) / 0.8)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: "rgb(var(--color-fg-muted))", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="title"
            width={180}
            tick={{ fill: "rgb(var(--color-fg-muted))", fontSize: 11 }}
          />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" fill={chartColorTokens.bar} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
