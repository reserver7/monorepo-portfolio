import type { Issue } from "@repo/opslens";

export function isIssueSlaRisk(issue: Issue) {
  if (issue.status === "resolved") return false;
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(issue.lastOccurredAt).getTime()) / 60000)
  );
  if (issue.severity === "critical") return elapsedMinutes >= 30;
  if (issue.severity === "high") return elapsedMinutes >= 60;
  return false;
}
