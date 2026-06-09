import type { IssueStatus, Severity } from "@repo/opslens";

export type IssueFilterFormValues = {
  status: "all" | IssueStatus;
  severity: "all" | Severity;
  assignee: "all" | "assigned" | "unassigned";
  sortBy: "recent" | "occurrence" | "severity";
};
