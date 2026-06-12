import { IssueSeverity, Prisma, type Deployment, type Issue, type IssueComment, type LogEvent, type QaScenario } from "@prisma/client";
import type { DeploymentImpactReportType, DeploymentType, IssueType, OpsAlertType, QaScenarioType } from "./ops.types.js";

export const parseJsonArray = (value: Prisma.JsonValue): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  return [];
};

export const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
};

export const toIssueTitleKey = (title: string): string | undefined => {
  const normalized = title.toLowerCase();
  if (normalized.includes("typeerror")) return "runtimeTypeError";
  if (normalized.includes("api 500") || normalized.includes("http 500") || normalized.includes("5xx")) {
    return "apiHttp500";
  }
  if (normalized.includes("timeout") || normalized.includes("time out") || normalized.includes("타임아웃")) {
    return "networkTimeout";
  }
  if (
    (normalized.includes("로그인") && normalized.includes("세션")) ||
    (normalized.includes("login") && normalized.includes("session"))
  ) {
    return "loginSessionIssue";
  }
  if (
    (normalized.includes("렌더링") && normalized.includes("지연")) ||
    (normalized.includes("render") && normalized.includes("latency")) ||
    (normalized.includes("rendering") && normalized.includes("delay"))
  ) {
    return "renderLatency";
  }
  if (
    normalized.includes("qa 회귀") ||
    normalized.includes("qa-regression") ||
    normalized.includes("qa regression")
  ) {
    return "qaRegression";
  }
  if (
    (normalized.includes("할인금액") && normalized.includes("누락")) ||
    (normalized.includes("discount") && (normalized.includes("missing") || normalized.includes("omitted")))
  ) {
    return "discountDisplayMissing";
  }
  if (normalized.includes("권한") && normalized.includes("루프")) return "docsPermissionLoop";
  if (normalized.includes("화이트보드") && normalized.includes("재연결")) return "whiteboardReconnectDelay";
  return undefined;
};

export const toIssueType = (
  issue: Issue & { deployment: Deployment | null; comments?: IssueComment[]; logs?: LogEvent[] }
): IssueType => ({
  id: issue.id,
  title: issue.title,
  severity: issue.severity,
  status: issue.status,
  priority: issue.priority,
  slaDueAt: issue.slaDueAt,
  escalationLevel: issue.escalationLevel,
  summary: issue.summary,
  probableCauses: parseJsonArray(issue.probableCauses),
  suggestedActions: parseJsonArray(issue.suggestedActions),
  reproductionGuide: issue.reproductionGuide,
  occurrenceCount: issue.occurrenceCount,
  serviceName: issue.serviceName,
  environment: issue.environment,
  assignee: issue.assignee ?? undefined,
  affectedArea: issue.affectedArea ?? undefined,
  deploymentCorrelation: issue.deploymentCorrelation ?? undefined,
  deploymentVersion: issue.deployment?.version,
  firstOccurredAt: issue.firstOccurredAt,
  lastOccurredAt: issue.lastOccurredAt,
  createdAt: issue.createdAt,
  updatedAt: issue.updatedAt,
  logs: (issue.logs ?? []).map((log) => ({
    id: log.id,
    rawMessage: log.rawMessage,
    normalizedMessage: log.normalizedMessage,
    source: log.source,
    level: log.level,
    occurredAt: log.occurredAt,
    endpoint: log.endpoint ?? undefined,
    page: log.page ?? undefined,
    userId: log.userId ?? undefined
  })),
  comments: (issue.comments ?? []).map((comment) => ({
    id: comment.id,
    author: comment.author,
    body: comment.body,
    createdAt: comment.createdAt
  }))
});

export const toDeploymentType = (deployment: Deployment): DeploymentType => ({
  ...deployment,
  scopeTags: normalizeStringList(deployment.scopeTags),
  checklist: normalizeStringList(deployment.checklist)
});

export const getDeploymentRiskLevel = (report: {
  increasedIssues: DeploymentImpactReportType["increasedIssues"];
  totalAfterErrorCount: number;
}): "normal" | "caution" | "rollback_review" => {
  const hasCriticalIncrease = report.increasedIssues.some((issue) => issue.severity === IssueSeverity.critical);
  const hasHighVolume = report.totalAfterErrorCount >= 100;
  if (hasCriticalIncrease || report.increasedIssues.length >= 5 || hasHighVolume) return "rollback_review";
  if (report.increasedIssues.length > 0 || report.totalAfterErrorCount >= 30) return "caution";
  return "normal";
};

export const getDeploymentRecommendedAction = (riskLevel: string): string => {
  if (riskLevel === "rollback_review") return "Critical 증가 또는 높은 에러량이 감지되었습니다. 담당자 확인 후 롤백 여부를 검토하세요.";
  if (riskLevel === "caution") return "배포 후 증가 신호가 있습니다. 모니터링 윈도우 동안 관련 이슈를 우선 확인하세요.";
  return "배포 후 증가 신호가 낮습니다. 설정한 모니터링 윈도우까지 추적을 유지하세요.";
};

export const toQaScenarioType = (scenario: QaScenario): QaScenarioType => ({
  id: scenario.id,
  featureName: scenario.featureName,
  generatedCases: parseJsonArray(scenario.generatedCases),
  riskPoints: parseJsonArray(scenario.riskPoints),
  regressionTargets: parseJsonArray(scenario.regressionTargets),
  audience: scenario.audience,
  status: scenario.status,
  owner: scenario.owner,
  reviewer: scenario.reviewer,
  executionStatus: scenario.executionStatus,
  executedAt: scenario.executedAt,
  notes: scenario.notes,
  createdAt: scenario.createdAt
});

export const toOpsAlertType = (alert: {
  id: string;
  level: IssueSeverity;
  title: string;
  message: string;
  source: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}): OpsAlertType => ({
  id: alert.id,
  level: alert.level,
  title: alert.title,
  message: alert.message,
  source: alert.source,
  link: alert.link,
  readAt: alert.readAt,
  createdAt: alert.createdAt
});
