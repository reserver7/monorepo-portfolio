import type { Plugin, ScriptableContext } from "chart.js";
import { chartColorTokens } from "@repo/ui";

export const formatSeverityLabel = (value: string) => {
  if (value === "critical") return "Critical";
  if (value === "high") return "High";
  if (value === "medium") return "Medium";
  if (value === "low") return "Low";
  return value;
};

export const truncateLabel = (value: string, max = 20) => (value.length > max ? `${value.slice(0, max)}...` : value);

export const getCssVar = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `rgb(${value})` : fallback;
};

const getCssVarRaw = (name: string) => {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

const extractVarName = (token: string) => {
  const match = token.match(/var\((--[^)]+)\)/);
  return match?.[1] ?? null;
};

export const resolveCanvasColor = (token: string, fallback: string) => {
  const varName = extractVarName(token);
  if (!varName) return token || fallback;
  const raw = getCssVarRaw(varName);
  if (!raw) return fallback;
  if (token.startsWith("rgb(")) return `rgb(${raw})`;
  if (token.startsWith("rgba(")) return `rgba(${raw})`;
  return `rgb(${raw})`;
};

export const trendToRgba = (alpha: number) => {
  const varName = extractVarName(chartColorTokens.trend) ?? "--color-accent-primary";
  const raw = getCssVarRaw(varName);
  if (raw) {
    const normalized = raw.includes(",") ? raw : raw.replace(/\s+/g, ", ");
    return `rgba(${normalized}, ${alpha})`;
  }
  return `rgba(37, 99, 235, ${alpha})`;
};

export const getBlueGradient = (ctx: ScriptableContext<any>, fromAlpha: number, toAlpha: number) => {
  const { chart } = ctx;
  const area = chart.chartArea;
  if (!area) return trendToRgba(fromAlpha);
  const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
  gradient.addColorStop(0, trendToRgba(fromAlpha));
  gradient.addColorStop(1, trendToRgba(toAlpha));
  return gradient;
};

export const getSeverityColor = (severity: string) => {
  const token = chartColorTokens.severity[severity as keyof typeof chartColorTokens.severity] ?? chartColorTokens.fallback;
  return resolveCanvasColor(token, "#2563eb");
};

export const createBarValueLabelPlugin = (unit: string): Plugin<"bar"> => ({
  id: "bar-value-label",
  afterDatasetsDraw(chart) {
    const dataset = chart.data.datasets[0];
    if (!dataset) return;

    const values = dataset.data as number[];
    const meta = chart.getDatasetMeta(0);
    const { ctx } = chart;

    ctx.save();
    ctx.fillStyle = getCssVar("--color-fg-default", "#111827");
    ctx.font = "600 11px var(--font-family-body, Pretendard)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    meta.data.forEach((bar, index) => {
      const value = values[index] ?? 0;
      ctx.fillText(`${value}${unit}`, bar.x + 8, bar.y);
    });
    ctx.restore();
  }
});
