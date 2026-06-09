import type { Severity } from "@repo/opslens";
import type { IssueFilterFormValues } from "./types";

export const ISSUE_FILTER_DEFAULT_VALUES: IssueFilterFormValues = {
  status: "all",
  severity: "all",
  assignee: "all",
  sortBy: "recent"
};

export const ISSUE_STATUS_OPTIONS: Array<{ label: string; value: IssueFilterFormValues["status"] }> = [
  { label: "전체", value: "all" },
  { label: "신규", value: "new" },
  { label: "분석중", value: "analyzing" },
  { label: "대응중", value: "in_progress" },
  { label: "해결", value: "resolved" }
];

export const ISSUE_DETAIL_STATUS_OPTIONS: Array<{
  label: string;
  value: Exclude<IssueFilterFormValues["status"], "all">;
}> = [
  { label: "신규", value: "new" },
  { label: "분석중", value: "analyzing" },
  { label: "대응중", value: "in_progress" },
  { label: "해결", value: "resolved" }
];

export const ISSUE_SEVERITY_OPTIONS: Array<{ label: string; value: IssueFilterFormValues["severity"] }> = [
  { label: "전체", value: "all" },
  { label: "critical", value: "critical" },
  { label: "high", value: "high" },
  { label: "medium", value: "medium" },
  { label: "low", value: "low" }
];

export const ISSUE_ASSIGNEE_OPTIONS: Array<{ label: string; value: IssueFilterFormValues["assignee"] }> = [
  { label: "전체", value: "all" },
  { label: "지정됨", value: "assigned" },
  { label: "미지정", value: "unassigned" }
];

export const ISSUE_SORT_OPTIONS: Array<{ label: string; value: IssueFilterFormValues["sortBy"] }> = [
  { label: "최근 발생순", value: "recent" },
  { label: "발생 횟수순", value: "occurrence" },
  { label: "심각도순", value: "severity" }
];

export const ISSUE_SEVERITY_SCORE: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export const ISSUE_TONE = {
  criticalHigh: "danger",
  unassigned: "info",
  slaRisk: "warning"
} as const;
