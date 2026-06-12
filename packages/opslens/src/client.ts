import { graphqlRequest } from "@repo/react-query";
import {
  getOpslensApiUrl,
  resolveOpsApiUrl
} from "./core";
import type { DashboardSummary, Deployment, DeploymentImpactReport, Environment, ErrorCluster, Issue, IssueStatus, IssueSummary, LogAnalysisSession, OpsAlert, OpsAuditLog, OpsReport, OpsReportSnapshot, OpsSetting, QaScenario, Severity } from "./types";

export * from "./auth";
export { configureOpslensClient } from "./core";
export { opslensQueryKeys } from "./query-keys";
export * from "./types";

export const toOptionalServiceName = (serviceName?: string): string | undefined =>
  !serviceName || serviceName === "all" ? undefined : serviceName;

export const toOptionalSearch = (search?: string): string | undefined => {
  const normalized = search?.trim();
  return normalized ? normalized : undefined;
};

export const toOptionalStatus = (status?: "all" | IssueStatus): IssueStatus | undefined =>
  !status || status === "all" ? undefined : status;

export const toOptionalSeverity = (severity?: "all" | Severity): Severity | undefined =>
  !severity || severity === "all" ? undefined : severity;

export function createOpsLogTailEventSource(input: {
  environment?: string;
  serviceName?: string;
  source?: string;
}): EventSource {
  const params = new URLSearchParams();
  if (input.environment) params.set("environment", input.environment);
  if (input.serviceName) params.set("serviceName", input.serviceName);
  if (input.source) params.set("source", input.source);
  const query = params.toString();
  const base = resolveOpsApiUrl();
  const url = query.length > 0 ? `${base}/ops/log-tail?${query}` : `${base}/ops/log-tail`;
  return new EventSource(url, { withCredentials: false });
}

export async function getDashboardSummary(filter: {
  environment: Environment;
  serviceName?: string;
  query?: string;
  from?: string;
  to?: string;
}): Promise<DashboardSummary> {
  const data = await graphqlRequest<{ dashboardSummary: DashboardSummary }>(
    getOpslensApiUrl(),
    `
    query DashboardSummary($filter: DashboardFilterInput) {
      dashboardSummary(filter: $filter) {
        todayIssueCount
        severityDistribution { severity count }
        errorTrend24h { hour count }
        topRepeatedErrors { issueId title titleKey severity count }
        newAfterLatestDeployment { issueId title titleKey severity count }
        aiBriefing
      }
    }
  `,
    {
      filter: {
        environment: filter.environment,
        serviceName: filter.serviceName === "all" ? undefined : filter.serviceName,
        query: filter.query || undefined,
        from: filter.from,
        to: filter.to
      }
    }
  );

  return data.dashboardSummary;
}

export async function analyzeLogs(input: {
  rawLogs: string;
  source: string;
  environment: Environment;
  serviceName: string;
  deploymentVersion?: string;
  clusterLimit?: number;
  requestedBy?: string;
}): Promise<{
  createdIssues: number;
  updatedIssues: number;
  clusterTotalCount: number;
  clusterDisplayedCount: number;
  clusters: ErrorCluster[];
}> {
  const data = await graphqlRequest<{
    analyzeLogs: {
      createdIssues: number;
      updatedIssues: number;
      clusterTotalCount: number;
      clusterDisplayedCount: number;
      clusters: ErrorCluster[];
    };
  }>(
    getOpslensApiUrl(),
    `
    mutation AnalyzeLogs($input: AnalyzeLogsInputModel!) {
      analyzeLogs(input: $input) {
        createdIssues
        updatedIssues
        clusterTotalCount
        clusterDisplayedCount
        clusters {
          title
          normalizedMessage
          severity
          count
          firstSeen
          lastSeen
          probableCauses
          suggestedActions
          affectedArea
          deploymentCorrelation
          reproductionGuide
        }
      }
    }
    `,
    { input },
    {
      notifyOnSuccess: false,
      notifyOnError: false
    }
  );

  return data.analyzeLogs;
}

export async function listIssues(filter: {
  environment: Environment;
  serviceName?: string;
  severity?: string;
  status?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: Issue[]; totalCount: number; page: number; pageSize: number }> {
  const data = await graphqlRequest<{
    issues: { items: Issue[]; totalCount: number; page: number; pageSize: number };
  }>(
    getOpslensApiUrl(),
    `
    query Issues($filter: IssueFilterInput) {
      issues(filter: $filter) {
        items {
          id
          title
          severity
          status
          priority
          slaDueAt
          escalationLevel
          summary
          occurrenceCount
          serviceName
          environment
          assignee
          lastOccurredAt
          deploymentVersion
          affectedArea
        }
        totalCount
        page
        pageSize
      }
    }
  `,
    {
      filter: {
        ...filter,
        serviceName: filter.serviceName === "all" ? undefined : filter.serviceName
      }
    }
  );

  return data.issues;
}

export async function getIssueSummary(filter: {
  environment: Environment;
  serviceName?: string;
  severity?: string;
  status?: string;
  query?: string;
}): Promise<IssueSummary> {
  const data = await graphqlRequest<{ issueSummary: IssueSummary }>(
    getOpslensApiUrl(),
    `
    query IssueSummary($filter: IssueFilterInput) {
      issueSummary(filter: $filter) {
        open
        criticalHigh
        unassigned
        slaRisk
      }
    }
  `,
    {
      filter: {
        ...filter,
        serviceName: filter.serviceName === "all" ? undefined : filter.serviceName
      }
    }
  );

  return data.issueSummary;
}

export async function getIssueDetail(issueId: string): Promise<Issue> {
  const data = await graphqlRequest<{ issueDetail: Issue }>(
    getOpslensApiUrl(),
    `
    query IssueDetail($issueId: String!) {
      issueDetail(issueId: $issueId) {
        id
        title
        severity
        status
        priority
        slaDueAt
        escalationLevel
        summary
        probableCauses
        suggestedActions
        reproductionGuide
        occurrenceCount
        serviceName
        environment
        assignee
        affectedArea
        deploymentCorrelation
        deploymentVersion
        firstOccurredAt
        lastOccurredAt
        createdAt
        updatedAt
        logs {
          id
          rawMessage
          normalizedMessage
          source
          level
          occurredAt
          endpoint
          page
          userId
        }
        comments {
          id
          author
          body
          createdAt
        }
      }
    }
  `,
    { issueId }
  );

  return data.issueDetail;
}

export async function updateIssueStatus(issueId: string, status: IssueStatus): Promise<Issue> {
  const data = await graphqlRequest<{ updateIssueStatus: Issue }>(
    getOpslensApiUrl(),
    `
    mutation UpdateIssueStatus($input: UpdateIssueStatusInput!) {
      updateIssueStatus(input: $input) {
        id
        title
        status
        priority
        slaDueAt
        escalationLevel
        severity
        summary
        probableCauses
        suggestedActions
        reproductionGuide
        occurrenceCount
        serviceName
        environment
        assignee
        firstOccurredAt
        lastOccurredAt
        createdAt
        updatedAt
        logs { id rawMessage normalizedMessage source level occurredAt }
        comments { id author body createdAt }
      }
    }
  `,
    { input: { issueId, status } },
    { successMessage: "이슈 상태가 변경되었습니다." }
  );

  return data.updateIssueStatus;
}

export async function assignIssue(issueId: string, assignee: string): Promise<Issue> {
  const data = await graphqlRequest<{ assignIssue: Issue }>(
    getOpslensApiUrl(),
    `
    mutation AssignIssue($input: AssignIssueInput!) {
      assignIssue(input: $input) {
        id
        title
        status
        priority
        slaDueAt
        escalationLevel
        severity
        summary
        probableCauses
        suggestedActions
        reproductionGuide
        occurrenceCount
        serviceName
        environment
        assignee
        firstOccurredAt
        lastOccurredAt
        createdAt
        updatedAt
        logs { id rawMessage normalizedMessage source level occurredAt }
        comments { id author body createdAt }
      }
    }
  `,
    { input: { issueId, assignee } },
    { successMessage: "담당자가 지정되었습니다." }
  );

  return data.assignIssue;
}

export async function addIssueComment(issueId: string, author: string, body: string): Promise<Issue> {
  const data = await graphqlRequest<{ addIssueComment: Issue }>(
    getOpslensApiUrl(),
    `
    mutation AddIssueComment($input: AddIssueCommentInput!) {
      addIssueComment(input: $input) {
        id
        title
        status
        priority
        slaDueAt
        escalationLevel
        severity
        summary
        probableCauses
        suggestedActions
        reproductionGuide
        occurrenceCount
        serviceName
        environment
        assignee
        firstOccurredAt
        lastOccurredAt
        createdAt
        updatedAt
        logs { id rawMessage normalizedMessage source level occurredAt endpoint page userId }
        comments { id author body createdAt }
      }
    }
  `,
    { input: { issueId, author, body } },
    { successMessage: "코멘트가 등록되었습니다." }
  );

  return data.addIssueComment;
}

export async function registerDeployment(input: {
  version: string;
  environment: Environment;
  changelog: string;
  status?: string;
  owner?: string;
  approver?: string;
  scopeTags?: string[];
  checklist?: string[];
  rollbackCriteria?: string;
  monitoringWindowMin?: number;
  deployedAt?: string;
}): Promise<Deployment> {
  const data = await graphqlRequest<{ registerDeployment: Deployment }>(
    getOpslensApiUrl(),
    `
    mutation RegisterDeployment($input: RegisterDeploymentInput!) {
      registerDeployment(input: $input) {
        id
        version
        environment
        changelog
        status
        owner
        approver
        scopeTags
        checklist
        rollbackCriteria
        monitoringWindowMin
        deployedAt
      }
    }
  `,
    { input },
    { successMessage: "배포 이력이 등록되었습니다." }
  );

  return data.registerDeployment;
}

export async function getDeployments(environment?: Environment): Promise<Deployment[]> {
  const data = await graphqlRequest<{ deployments: Deployment[] }>(
    getOpslensApiUrl(),
    `
    query Deployments($environment: String) {
      deployments(environment: $environment) {
        id
        version
        environment
        changelog
        status
        owner
        approver
        scopeTags
        checklist
        rollbackCriteria
        monitoringWindowMin
        deployedAt
      }
    }
  `,
    { environment }
  );

  return data.deployments;
}

export async function getDeploymentImpact(
  version: string,
  environment: Environment
): Promise<DeploymentImpactReport> {
  const data = await graphqlRequest<{ deploymentImpact: DeploymentImpactReport }>(
    getOpslensApiUrl(),
    `
    query DeploymentImpact($input: DeploymentImpactInput!) {
      deploymentImpact(input: $input) {
        version
        environment
        deployedAt
        increasedIssueCount
        totalAfterErrorCount
        riskLevel
        recommendedAction
        monitoringWindowMin
        summary
        increasedIssues {
          issueId
          title
          severity
          serviceName
          beforeCount
          afterCount
          delta
        }
      }
    }
  `,
    { input: { version, environment } }
  );

  return data.deploymentImpact;
}

export async function getAiBriefing(filter: {
  environment: Environment;
  serviceName?: string;
  query?: string;
  from?: string;
  to?: string;
}): Promise<string> {
  const data = await graphqlRequest<{ aiBriefing: string }>(
    getOpslensApiUrl(),
    `
    query AiBriefing($filter: DashboardFilterInput) {
      aiBriefing(filter: $filter)
    }
  `,
    {
      filter: {
        environment: filter.environment,
        serviceName: filter.serviceName === "all" ? undefined : filter.serviceName,
        query: filter.query || undefined,
        from: filter.from,
        to: filter.to
      }
    }
  );

  return data.aiBriefing;
}

export async function getOpsReport(filter: {
  environment: Environment;
  serviceName?: string;
  query?: string;
  from?: string;
  to?: string;
}): Promise<OpsReport> {
  const data = await graphqlRequest<{ opsReport: OpsReport }>(
    getOpslensApiUrl(),
    `
    query OpsReport($filter: DashboardFilterInput) {
      opsReport(filter: $filter) {
        title
        generatedAt
        riskLevel
        executiveSummary
        technicalSummary
        shareText
        kpis { label value helper tone }
        actionItems { title description owner priority }
        priorityIssues {
          issueId
          title
          severity
          status
          serviceName
          occurrenceCount
        }
      }
    }
  `,
    {
      filter: {
        environment: filter.environment,
        serviceName: filter.serviceName === "all" ? undefined : filter.serviceName,
        query: filter.query || undefined,
        from: filter.from,
        to: filter.to
      }
    }
  );

  return data.opsReport;
}

export async function generateQaScenario(input: {
  featureName: string;
  changedScreens: string;
  relatedApis: string;
  releaseNote: string;
  audience: string;
  owner?: string;
  reviewer?: string;
}): Promise<QaScenario> {
  const data = await graphqlRequest<{ generateQaScenario: QaScenario }>(
    getOpslensApiUrl(),
    `
    mutation GenerateQaScenario($input: QaAssistantInputModel!) {
      generateQaScenario(input: $input) {
        id
        featureName
        generatedCases
        riskPoints
        regressionTargets
        audience
        status
        owner
        reviewer
        executionStatus
        executedAt
        notes
        createdAt
      }
    }
  `,
    { input },
    { successMessage: "QA 시나리오가 생성되었습니다." }
  );

  return data.generateQaScenario;
}

export async function getRecentQaScenarios(): Promise<QaScenario[]> {
  const data = await graphqlRequest<{ recentQaScenarios: QaScenario[] }>(
    getOpslensApiUrl(),
    `
    query RecentQaScenarios {
      recentQaScenarios {
        id
        featureName
        generatedCases
        riskPoints
        regressionTargets
        audience
        status
        owner
        reviewer
        executionStatus
        executedAt
        notes
        createdAt
      }
    }
  `
  );

  return data.recentQaScenarios;
}

export async function getOpsAlerts(): Promise<OpsAlert[]> {
  const data = await graphqlRequest<{ opsAlerts: OpsAlert[] }>(
    getOpslensApiUrl(),
    `
    query OpsAlerts {
      opsAlerts {
        id
        level
        title
        message
        source
        link
        readAt
        createdAt
      }
    }
  `
  );

  return data.opsAlerts;
}

export async function createOpsAlert(input: {
  level: Severity;
  title: string;
  message: string;
  source: string;
  link?: string;
}): Promise<OpsAlert> {
  const data = await graphqlRequest<{ createOpsAlert: OpsAlert }>(
    getOpslensApiUrl(),
    `
    mutation CreateOpsAlert($input: CreateOpsAlertInput!) {
      createOpsAlert(input: $input) {
        id
        level
        title
        message
        source
        link
        readAt
        createdAt
      }
    }
  `,
    { input },
    { successMessage: "운영 알림이 등록되었습니다." }
  );

  return data.createOpsAlert;
}

export async function markOpsAlertRead(alertId: string): Promise<OpsAlert> {
  const data = await graphqlRequest<{ markOpsAlertRead: OpsAlert }>(
    getOpslensApiUrl(),
    `
    mutation MarkOpsAlertRead($alertId: String!) {
      markOpsAlertRead(alertId: $alertId) {
        id
        level
        title
        message
        source
        link
        readAt
        createdAt
      }
    }
  `,
    { alertId },
    { notifyOnSuccess: false }
  );

  return data.markOpsAlertRead;
}

export async function markAllOpsAlertsRead(): Promise<boolean> {
  const data = await graphqlRequest<{ markAllOpsAlertsRead: boolean }>(
    getOpslensApiUrl(),
    `
    mutation MarkAllOpsAlertsRead {
      markAllOpsAlertsRead
    }
  `,
    undefined,
    { notifyOnSuccess: false }
  );

  return data.markAllOpsAlertsRead;
}

export async function deleteOpsAlert(alertId: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteOpsAlert: boolean }>(
    getOpslensApiUrl(),
    `
    mutation DeleteOpsAlert($alertId: String!) {
      deleteOpsAlert(alertId: $alertId)
    }
  `,
    { alertId },
    { notifyOnSuccess: false }
  );

  return data.deleteOpsAlert;
}

export async function getLogAnalysisSessions(): Promise<LogAnalysisSession[]> {
  const data = await graphqlRequest<{ logAnalysisSessions: LogAnalysisSession[] }>(
    getOpslensApiUrl(),
    `
    query LogAnalysisSessions {
      logAnalysisSessions {
        id
        environment
        serviceName
        source
        requestedBy
        deploymentVersion
        rawLineCount
        clusterTotalCount
        clusterDisplayedCount
        createdIssues
        updatedIssues
        topClusterTitle
        createdAt
      }
    }
  `
  );

  return data.logAnalysisSessions;
}

export async function getReportSnapshots(): Promise<OpsReportSnapshot[]> {
  const data = await graphqlRequest<{ reportSnapshots: OpsReportSnapshot[] }>(
    getOpslensApiUrl(),
    `
    query ReportSnapshots {
      reportSnapshots {
        id
        title
        environment
        riskLevel
        executiveSummary
        technicalSummary
        shareText
        generatedBy
        pinned
        sharedAt
        generatedAt
      }
    }
  `
  );

  return data.reportSnapshots;
}

export async function updateReportSnapshot(input: {
  snapshotId: string;
  pinned?: boolean;
  markShared?: boolean;
  actor?: string;
}): Promise<OpsReportSnapshot> {
  const data = await graphqlRequest<{ updateReportSnapshot: OpsReportSnapshot }>(
    getOpslensApiUrl(),
    `
    mutation UpdateReportSnapshot($input: UpdateReportSnapshotInput!) {
      updateReportSnapshot(input: $input) {
        id
        title
        environment
        riskLevel
        executiveSummary
        technicalSummary
        shareText
        generatedBy
        pinned
        sharedAt
        generatedAt
      }
    }
  `,
    { input },
    { notifyOnSuccess: false }
  );

  return data.updateReportSnapshot;
}

export async function deleteReportSnapshot(snapshotId: string, actor?: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteReportSnapshot: boolean }>(
    getOpslensApiUrl(),
    `
    mutation DeleteReportSnapshot($snapshotId: String!, $actor: String) {
      deleteReportSnapshot(snapshotId: $snapshotId, actor: $actor)
    }
  `,
    { snapshotId, actor },
    { notifyOnSuccess: false }
  );

  return data.deleteReportSnapshot;
}

export async function getOpsAuditLogs(filter?: {
  actor?: string;
  action?: string;
  targetType?: string;
  severity?: string;
  query?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<OpsAuditLog[]> {
  const data = await graphqlRequest<{ opsAuditLogs: OpsAuditLog[] }>(
    getOpslensApiUrl(),
    `
    query OpsAuditLogs($filter: OpsAuditLogFilterInput) {
      opsAuditLogs(filter: $filter) {
        id
        actor
        action
        targetType
        targetId
        severity
        summary
        beforeValue
        afterValue
        metadata
        createdAt
      }
    }
  `,
    { filter }
  );

  return data.opsAuditLogs;
}

export async function getOpsSettings(): Promise<OpsSetting[]> {
  const data = await graphqlRequest<{ opsSettings: OpsSetting[] }>(
    getOpslensApiUrl(),
    `
    query OpsSettings {
      opsSettings {
        id
        key
        value
        description
        category
        riskLevel
        editable
        updatedBy
        changeReason
        updatedAt
      }
    }
  `
  );

  return data.opsSettings;
}

export async function upsertOpsSetting(input: {
  key: string;
  value: string;
  description?: string;
  category?: string;
  riskLevel?: string;
  editable?: boolean;
  updatedBy?: string;
  changeReason?: string;
}): Promise<OpsSetting> {
  const data = await graphqlRequest<{ upsertOpsSetting: OpsSetting }>(
    getOpslensApiUrl(),
    `
    mutation UpsertOpsSetting($input: UpsertOpsSettingInput!) {
      upsertOpsSetting(input: $input) {
        id
        key
        value
        description
        category
        riskLevel
        editable
        updatedBy
        changeReason
        updatedAt
      }
    }
  `,
    { input },
    { successMessage: "운영 설정이 저장되었습니다." }
  );

  return data.upsertOpsSetting;
}

export async function deleteQaScenario(scenarioId: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteQaScenario: boolean }>(
    getOpslensApiUrl(),
    `
    mutation DeleteQaScenario($scenarioId: String!) {
      deleteQaScenario(scenarioId: $scenarioId)
    }
  `,
    { scenarioId },
    { successMessage: "QA 산출물이 삭제되었습니다." }
  );

  return data.deleteQaScenario;
}
