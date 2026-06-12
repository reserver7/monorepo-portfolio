"use client";

import { memo, useMemo } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions
} from "chart.js";
import { useTranslations } from "next-intl";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Box, StateView, chartColorTokens } from "@repo/ui";
import type { DashboardSummary } from "@repo/opslens";
import {
  createBarValueLabelPlugin,
  formatSeverityLabel,
  getBlueGradient,
  getCssVar,
  getSeverityColor,
  resolveCanvasColor,
  trendToRgba,
  truncateLabel
} from "../utils/dashboard-chart-utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

type Summary = Pick<DashboardSummary, "severityDistribution" | "errorTrend24h" | "topRepeatedErrors">;

export const SeverityDistributionChart = memo(function SeverityDistributionChart({ summary }: { summary: Summary }) {
  const tDashboard = useTranslations("dashboard");
  const eventUnit = tDashboard("units.events");
  const total = summary.severityDistribution.reduce((acc, item) => acc + item.count, 0);

  if (total <= 0) {
    return (
      <Box className="h-[232px] w-full">
        <StateView variant="empty" size="sm" title={tDashboard("empty.noSeverityData")} />
      </Box>
    );
  }

  const data: ChartData<"doughnut"> = useMemo(
    () => ({
      labels: summary.severityDistribution.map((item) => formatSeverityLabel(item.severity)),
      datasets: [
        {
          data: summary.severityDistribution.map((item) => item.count),
          backgroundColor: summary.severityDistribution.map((item) => getSeverityColor(item.severity)),
          borderColor: getCssVar("--color-bg-surface", "#ffffff"),
          borderWidth: 2,
          hoverOffset: 4
        }
      ]
    }),
    [summary.severityDistribution]
  );

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 0, bottom: 0, left: 4, right: 4 } },
    cutout: "64%",
    radius: "82%",
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          color: getCssVar("--color-fg-muted", "#6b7280"),
          font: {
            size: 11,
            weight: 500
          },
          boxWidth: 8,
          boxHeight: 8,
          padding: 10,
          generateLabels: (chart) =>
            summary.severityDistribution.map((entry, index) => {
              const count = entry.count ?? 0;
              const ratio = total > 0 ? Math.round((count / total) * 100) : 0;
              const color = getSeverityColor(entry.severity);
              return {
                text: `${formatSeverityLabel(entry.severity)} ${count}${eventUnit} · ${ratio}%`,
                fillStyle: color,
                strokeStyle: color,
                pointStyle: "circle" as const,
                lineWidth: 0,
                hidden: !chart.getDataVisibility(index),
                index
              };
            })
        }
      },
      tooltip: {
        backgroundColor: getCssVar("--color-bg-surface", "#111827"),
        titleColor: getCssVar("--color-fg-default", "#f9fafb"),
        bodyColor: getCssVar("--color-fg-default", "#f9fafb"),
        borderColor: getCssVar("--color-border-default", "#374151"),
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const label = context.label ?? "";
            const value = context.parsed ?? 0;
            return `${label}: ${value}${eventUnit}`;
          }
        }
      }
    }
  };

  return (
    <Box role="img" aria-label="심각도별 이슈 분포 도넛 차트" className="h-[232px] w-full">
      <Doughnut data={data} options={options} />
    </Box>
  );
});

export const ErrorTrendChart = memo(function ErrorTrendChart({ summary }: { summary: Summary }) {
  const tDashboard = useTranslations("dashboard");
  const eventUnit = tDashboard("units.events");
  const deltaLabel = tDashboard("units.delta");
  const counts = summary.errorTrend24h.map((item) => item.count);
  const total = counts.reduce((acc, value) => acc + value, 0);

  if (total <= 0) {
    return (
      <Box className="h-[232px] w-full">
        <StateView variant="empty" size="sm" title={tDashboard("empty.noTrendData")} />
      </Box>
    );
  }

  const movingAverage = useMemo(
    () =>
      counts.map((_, index) => {
        const start = Math.max(0, index - 2);
        const chunk = counts.slice(start, index + 1);
        return Math.round(chunk.reduce((acc, value) => acc + value, 0) / chunk.length);
      }),
    [counts]
  );
  const peak = Math.max(0, ...counts);

  const data: ChartData<"line"> = useMemo(
    () => ({
      labels: summary.errorTrend24h.map((item) => item.hour),
      datasets: [
        {
          label: "Error events",
          data: counts,
          borderColor: resolveCanvasColor(chartColorTokens.trend, "#2563eb"),
          borderWidth: 2.75,
          pointRadius: (ctx) => ((ctx.parsed.y as number) === peak && peak > 0 ? 3 : 0),
          pointHoverRadius: 5,
          pointHoverBorderWidth: 2,
          pointHoverBorderColor: getCssVar("--color-bg-surface", "#ffffff"),
          pointHoverBackgroundColor: resolveCanvasColor(chartColorTokens.trend, "#2563eb"),
          tension: 0.35,
          fill: true,
          backgroundColor: (context) => getBlueGradient(context, 0.28, 0.03)
        },
        {
          label: "Moving avg",
          data: movingAverage,
          borderColor: trendToRgba(0.5),
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.28,
          borderDash: [6, 4]
        }
      ]
    }),
    [summary.errorTrend24h, counts, peak, movingAverage]
  );

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 2, bottom: 0, left: 0, right: 0 } },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "line",
          boxWidth: 18,
          color: getCssVar("--color-fg-muted", "#6b7280")
        }
      },
      tooltip: {
        backgroundColor: getCssVar("--color-bg-surface", "#111827"),
        titleColor: getCssVar("--color-fg-default", "#f9fafb"),
        bodyColor: getCssVar("--color-fg-default", "#f9fafb"),
        borderColor: getCssVar("--color-border-default", "#374151"),
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}${eventUnit}`,
          afterBody: (items) => {
            const current = items[0]?.parsed?.y ?? 0;
            const previous = items[0]?.dataIndex && items[0].dataIndex > 0 ? counts[items[0].dataIndex - 1] ?? 0 : 0;
            const diff = current - previous;
            if (items[0]?.dataIndex === 0) return [];
            return [`${deltaLabel}: ${diff > 0 ? "+" : ""}${diff}${eventUnit}`];
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: getCssVar("--color-fg-muted", "#6b7280"), maxRotation: 0, autoSkip: true }
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: getCssVar("--color-fg-muted", "#6b7280") },
        grid: { color: getCssVar("--color-border-default", "#e5e7eb") },
        border: { display: false }
      }
    }
  };

  return (
    <Box role="img" aria-label="최근 24시간 에러 추이 선 그래프" className="h-[232px] w-full">
      <Line data={data} options={options} />
    </Box>
  );
});

export const TopRepeatedErrorsChart = memo(function TopRepeatedErrorsChart({ summary }: { summary: Summary }) {
  const tDashboard = useTranslations("dashboard");
  const eventUnit = tDashboard("units.events");
  const total = summary.topRepeatedErrors.reduce((acc, item) => acc + item.count, 0);

  if (summary.topRepeatedErrors.length === 0 || total <= 0) {
    return (
      <Box className="h-[248px] w-full">
        <StateView variant="empty" size="sm" title={tDashboard("empty.noTopRepeatedErrors")} />
      </Box>
    );
  }

  const labels = useMemo(
    () => summary.topRepeatedErrors.map((item, index) => `${index + 1}. ${truncateLabel(item.title)}`),
    [summary.topRepeatedErrors]
  );
  const peak = Math.max(0, ...summary.topRepeatedErrors.map((item) => item.count));
  const data: ChartData<"bar"> = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Count",
          data: summary.topRepeatedErrors.map((item) => item.count),
          borderRadius: 8,
          borderSkipped: false,
          backgroundColor: (context) => {
            if (context.dataIndex === 0) return getBlueGradient(context, 1, 0.58);
            return getBlueGradient(context, 0.86, 0.42);
          },
          hoverBackgroundColor: resolveCanvasColor(chartColorTokens.bar, "#2563eb"),
          barThickness: 12,
          maxBarThickness: 12
        }
      ]
    }),
    [labels, summary.topRepeatedErrors]
  );

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 0, bottom: 0, left: 0, right: 14 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: getCssVar("--color-bg-surface", "#111827"),
        titleColor: getCssVar("--color-fg-default", "#f9fafb"),
        bodyColor: getCssVar("--color-fg-default", "#f9fafb"),
        borderColor: getCssVar("--color-border-default", "#374151"),
        borderWidth: 1,
        callbacks: {
          title: (items) => items[0]?.label ?? "",
          label: (context) => `${context.parsed.x}${eventUnit}`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        suggestedMax: peak + Math.max(3, Math.round(peak * 0.15)),
        ticks: { precision: 0, color: getCssVar("--color-fg-muted", "#6b7280") },
        grid: { color: getCssVar("--color-border-default", "#e5e7eb") },
        border: { display: false }
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: getCssVar("--color-fg-muted", "#6b7280") }
      }
    }
  };

  return (
    <Box role="img" aria-label="반복 에러 상위 5개 막대 그래프" className="h-[248px] w-full">
      <Bar data={data} options={options} plugins={[createBarValueLabelPlugin(eventUnit)]} />
    </Box>
  );
});
