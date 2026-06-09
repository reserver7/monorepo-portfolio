import type { OpsReport } from "@repo/opslens";

type ReportTone = "default" | "warning" | "danger" | "primary";

export const getReportTone = (tone: string): ReportTone => {
  if (tone === "danger" || tone === "warning" || tone === "primary") return tone;
  return "default";
};

export const getReportRiskBadge = (riskLevel: string): { label: string; variant: "success" | "warning" | "danger" | "outline" } => {
  if (riskLevel === "critical") return { label: "위험", variant: "danger" };
  if (riskLevel === "warning") return { label: "주의", variant: "warning" };
  if (riskLevel === "normal") return { label: "정상", variant: "success" };
  return { label: riskLevel, variant: "outline" };
};

export const getReportGeneratedLabel = (report?: OpsReport): string => {
  if (!report) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(report.generatedAt));
};
