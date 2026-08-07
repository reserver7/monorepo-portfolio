export type Severity = "critical" | "high" | "medium" | "low";
export type IssueStatus = "new" | "analyzing" | "in_progress" | "resolved";
export type Environment = "dev" | "stage" | "prod";

export type OpsLogTailEvent = {
  id: string;
  rawMessage: string;
  normalizedMessage: string;
  source: string;
  level: string;
  occurredAt: string;
  issueId: string;
};

export type OpsFilterParams = {
  environment: Environment;
  serviceName: string;
  search: string;
  from?: string;
  to?: string;
};

export type IssueListFilterParams = OpsFilterParams & {
  status?: "all" | IssueStatus;
  severity?: "all" | Severity;
  page?: number;
};

export type DashboardSummary = {
  todayIssueCount: number;
  severityDistribution: Array<{ severity: Severity; count: number }>;
  errorTrend24h: Array<{ hour: string; count: number }>;
  topRepeatedErrors: Array<{ issueId: string; title: string; titleKey?: string; severity: Severity; count: number }>;
  newAfterLatestDeployment: Array<{ issueId: string; title: string; titleKey?: string; severity: Severity; count: number }>;
  aiBriefing: string;
};

export type ServiceHealth = {
  serviceName: string;
  status: "healthy" | "degraded" | "incident" | string;
  openIssueCount: number;
  criticalHighCount: number;
  lastOccurredAt?: string | null;
};

export type ErrorCluster = {
  title: string;
  normalizedMessage: string;
  severity: Severity;
  count: number;
  firstSeen: string;
  lastSeen: string;
  probableCauses: string[];
  suggestedActions: string[];
  affectedArea: string;
  deploymentCorrelation: string;
  reproductionGuide: string;
};

export type Issue = {
  id: string;
  title: string;
  severity: Severity;
  status: IssueStatus;
  priority: string;
  slaDueAt?: string | null;
  escalationLevel: number;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  rootCause?: string | null;
  postmortemUrl?: string | null;
  summary: string;
  probableCauses: string[];
  suggestedActions: string[];
  reproductionGuide: string;
  occurrenceCount: number;
  serviceName: string;
  environment: Environment;
  assignee?: string;
  affectedArea?: string;
  deploymentCorrelation?: string;
  deploymentVersion?: string;
  firstOccurredAt: string;
  lastOccurredAt: string;
  createdAt: string;
  updatedAt: string;
  logs: Array<{
    id: string;
    rawMessage: string;
    normalizedMessage: string;
    source: string;
    level: string;
    occurredAt: string;
    endpoint?: string;
    page?: string;
    userId?: string;
  }>;
  comments: Array<{
    id: string;
    author: string;
    body: string;
    createdAt: string;
  }>;
};

export type IncidentTimelineItem = {
  id: string;
  kind: "incident" | "deployment" | "log" | "comment" | "activity" | string;
  title: string;
  detail: string;
  actor?: string;
  tone: Severity | "info" | "warning" | string;
  occurredAt: string;
};

export type IssueSummary = {
  open: number;
  criticalHigh: number;
  unassigned: number;
  slaRisk: number;
};

export type Deployment = {
  id: string;
  version: string;
  environment: Environment;
  changelog: string;
  status: string;
  owner: string;
  approver?: string | null;
  scopeTags: string[];
  checklist: string[];
  rollbackCriteria?: string | null;
  monitoringWindowMin: number;
  deployedAt: string;
};

export type DeploymentImpactReport = {
  version: string;
  environment: Environment;
  deployedAt: string;
  increasedIssueCount: number;
  totalAfterErrorCount: number;
  riskLevel: "normal" | "caution" | "rollback_review" | string;
  recommendedAction: string;
  monitoringWindowMin: number;
  summary: string;
  increasedIssues: Array<{
    issueId: string;
    title: string;
    severity: Severity;
    serviceName: string;
    beforeCount: number;
    afterCount: number;
    delta: number;
  }>;
};

export type DeploymentReadiness = {
  environment: Environment;
  status: "ready" | "approval_required" | "blocked" | string;
  criticalHighCount: number;
  unassignedCount: number;
  recommendations: string[];
};

export type OpsReport = {
  snapshotId: string;
  title: string;
  generatedAt: string;
  riskLevel: "normal" | "warning" | "critical" | string;
  executiveSummary: string;
  technicalSummary: string;
  shareText: string;
  kpis: Array<{ label: string; value: string; helper: string; tone: string }>;
  actionItems: Array<{ title: string; description: string; owner: string; priority: string }>;
  priorityIssues: Array<{
    issueId: string;
    title: string;
    severity: Severity;
    status: IssueStatus;
    serviceName: string;
    occurrenceCount: number;
  }>;
};

export type OpsReportAction = {
  id: string;
  snapshotId: string;
  title: string;
  description: string;
  owner: string;
  priority: string;
  completedAt?: string | null;
  completedBy?: string | null;
};

export type OpsReportSnapshot = {
  id: string;
  title: string;
  environment?: Environment | null;
  riskLevel: string;
  executiveSummary: string;
  technicalSummary: string;
  shareText: string;
  generatedBy: string;
  pinned: boolean;
  sharedAt?: string | null;
  generatedAt: string;
};

export type OpsAuditLog = {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  severity: "info" | "warning" | "critical" | string;
  summary: string;
  beforeValue?: string | null;
  afterValue?: string | null;
  metadata: string;
  createdAt: string;
};

export type OpsAlert = {
  id: string;
  level: Severity;
  title: string;
  message: string;
  source: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export type OpsNotificationDelivery = {
  id: string;
  alertId: string;
  channel: string;
  status: string;
  attempts: number;
  lastError?: string | null;
  nextAttemptAt?: string | null;
  deliveredAt?: string | null;
};

export type LogAnalysisSession = {
  id: string;
  environment: Environment;
  serviceName: string;
  source: string;
  requestedBy: string;
  deploymentVersion?: string | null;
  rawLineCount: number;
  clusterTotalCount: number;
  clusterDisplayedCount: number;
  createdIssues: number;
  updatedIssues: number;
  topClusterTitle?: string | null;
  createdAt: string;
};

export type OpsSetting = {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  category: string;
  riskLevel: "low" | "medium" | "high" | "critical" | string;
  editable: boolean;
  updatedBy: string;
  changeReason?: string | null;
  updatedAt: string;
};

export type QaScenario = {
  id: string;
  featureName: string;
  generatedCases: string[];
  riskPoints: string[];
  regressionTargets: string[];
  audience: string;
  status: string;
  owner: string;
  reviewer?: string | null;
  executionStatus: string;
  executedAt?: string | null;
  notes?: string | null;
  createdAt: string;
};
