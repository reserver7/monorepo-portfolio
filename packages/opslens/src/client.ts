import { createQueryKeys, graphqlRequest } from "@repo/react-query";

const DEFAULT_OPSLENS_API_URL = "http://localhost:4100/graphql";
let opslensApiUrl = DEFAULT_OPSLENS_API_URL;

export function configureOpslensClient(options: { apiUrl?: string }): void {
  const nextApiUrl = options.apiUrl?.trim();
  opslensApiUrl = nextApiUrl && nextApiUrl.length > 0 ? nextApiUrl : DEFAULT_OPSLENS_API_URL;
}

const resolveAuthApiUrl = (): string => {
  const trimmed = opslensApiUrl.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/graphql")) {
    return trimmed.slice(0, -"/graphql".length);
  }
  return trimmed;
};

const resolveOpsApiUrl = (): string => {
  const trimmed = opslensApiUrl.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/graphql")) {
    return trimmed.slice(0, -"/graphql".length);
  }
  return trimmed;
};

export type Severity = "critical" | "high" | "medium" | "low";
export type IssueStatus = "new" | "analyzing" | "in_progress" | "resolved";
export type Environment = "dev" | "stage" | "prod";
export type AuthRole = "admin" | "operator" | "viewer";
export type AvatarColor = string;

export type OpsAuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  authProvider: "local" | "google" | "github";
  avatarColor: AvatarColor;
};

export type OpsLoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: OpsAuthUser;
};

export type OpsNotificationPolicy = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  slackEnabled: boolean;
  minLevel: "all" | "high" | "critical";
  quietHoursEnabled: boolean;
  quietFrom: string;
  quietTo: string;
};

export type OpsLogTailEvent = {
  id: string;
  rawMessage: string;
  normalizedMessage: string;
  source: string;
  level: string;
  occurredAt: string;
  issueId: string;
};

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

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    const message = payload?.message;
    if (Array.isArray(message)) {
      const joined = message.filter((entry) => typeof entry === "string").join(", ");
      if (joined.length > 0) {
        return joined;
      }
    }
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  } catch {
    // noop
  }
  return response.status === 401 ? "로그인이 필요합니다." : "요청 처리 중 오류가 발생했습니다.";
};

export async function loginOpslens(input: { email: string; password: string }): Promise<OpsLoginResponse> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as OpsLoginResponse;
}

export async function signupOpslens(input: { email: string; name: string; password: string }): Promise<OpsLoginResponse> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as OpsLoginResponse;
}

export async function requestPasswordResetOpslens(input: { email: string }): Promise<{ success: true }> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as { success: true };
}

export async function logoutOpslens(accessToken: string, refreshToken?: string): Promise<void> {
  await fetch(`${resolveAuthApiUrl()}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(refreshToken ? { refreshToken } : {})
  }).catch(() => undefined);
}

export async function refreshOpslens(refreshToken: string): Promise<OpsLoginResponse> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ refreshToken })
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as OpsLoginResponse;
}

export async function getOpslensMe(accessToken: string): Promise<OpsAuthUser> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as OpsAuthUser;
}

export async function updateOpslensProfile(
  accessToken: string,
  input: {
    name: string;
    avatarColor?: AvatarColor;
  }
): Promise<OpsAuthUser> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as OpsAuthUser;
}

export async function changeOpslensPassword(
  accessToken: string,
  input: {
    currentPassword: string;
    newPassword: string;
  }
): Promise<{ success: true }> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/password`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as { success: true };
}

export async function getOpslensNotificationPolicy(accessToken: string): Promise<OpsNotificationPolicy> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/notification-policy`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as OpsNotificationPolicy;
}

export async function updateOpslensNotificationPolicy(
  accessToken: string,
  input: OpsNotificationPolicy
): Promise<OpsNotificationPolicy> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/notification-policy`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as OpsNotificationPolicy;
}

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

export const toOptionalServiceName = (serviceName: string): string | undefined =>
  serviceName === "all" ? undefined : serviceName;

export const toOptionalSearch = (search: string): string | undefined => {
  const trimmed = search.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const toOptionalStatus = (status: "all" | IssueStatus | undefined): IssueStatus | undefined =>
  status && status !== "all" ? status : undefined;

export const toOptionalSeverity = (severity: "all" | Severity | undefined): Severity | undefined =>
  severity && severity !== "all" ? severity : undefined;

const opslensKeysBase = createQueryKeys("opslens");

export const opslensQueryKeys = {
  all: opslensKeysBase.all,
  dashboard: (filter: OpsFilterParams) =>
    opslensKeysBase.custom(
      "dashboard",
      filter.environment,
      filter.serviceName,
      filter.search,
      filter.from,
      filter.to
    ),
  reportsSummary: (filter: OpsFilterParams) =>
    opslensKeysBase.custom(
      "reports",
      "summary",
      filter.environment,
      filter.serviceName,
      filter.search,
      filter.from,
      filter.to
    ),
  reportsBriefing: (filter: OpsFilterParams) =>
    opslensKeysBase.custom(
      "reports",
      "briefing",
      filter.environment,
      filter.serviceName,
      filter.search,
      filter.from,
      filter.to
    ),
  opsReport: (filter: OpsFilterParams) =>
    opslensKeysBase.custom(
      "reports",
      "structured",
      filter.environment,
      filter.serviceName,
      filter.search,
      filter.from,
      filter.to
    ),
  reportsIssues: (filter: OpsFilterParams) =>
    opslensKeysBase.custom(
      "reports",
      "issues",
      filter.environment,
      filter.serviceName,
      filter.search
    ),
  issues: (filter: IssueListFilterParams) =>
    opslensKeysBase.custom(
      "issues",
      filter.environment,
      filter.serviceName,
      filter.search,
      filter.status,
      filter.severity,
      filter.page
    ),
  issueDetail: (issueId: string) => opslensKeysBase.custom("issue-detail", issueId),
  deployments: (environment: Environment) => opslensKeysBase.custom("deployments", environment),
  deploymentImpact: (environment: Environment, version?: string) =>
    opslensKeysBase.custom("deployment-impact", environment, version),
  qaScenarios: () => opslensKeysBase.custom("qa-scenarios"),
  alerts: () => opslensKeysBase.custom("alerts"),
  logAnalysisSessions: () => opslensKeysBase.custom("log-analysis-sessions"),
  reportSnapshots: () => opslensKeysBase.custom("report-snapshots"),
  settings: () => opslensKeysBase.custom("settings")
};

export type DashboardSummary = {
  todayIssueCount: number;
  severityDistribution: Array<{ severity: Severity; count: number }>;
  errorTrend24h: Array<{ hour: string; count: number }>;
  topRepeatedErrors: Array<{ issueId: string; title: string; titleKey?: string; severity: Severity; count: number }>;
  newAfterLatestDeployment: Array<{ issueId: string; title: string; titleKey?: string; severity: Severity; count: number }>;
  aiBriefing: string;
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

export type OpsReport = {
  title: string;
  generatedAt: string;
  riskLevel: "normal" | "warning" | "critical" | string;
  executiveSummary: string;
  technicalSummary: string;
  shareText: string;
  kpis: Array<{
    label: string;
    value: string;
    helper: string;
    tone: string;
  }>;
  actionItems: Array<{
    title: string;
    description: string;
    owner: string;
    priority: string;
  }>;
  priorityIssues: Array<{
    issueId: string;
    title: string;
    severity: Severity;
    status: IssueStatus;
    serviceName: string;
    occurrenceCount: number;
  }>;
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
  generatedAt: string;
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
  updatedBy: string;
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

export async function getDashboardSummary(filter: {
  environment: Environment;
  serviceName?: string;
  query?: string;
  from?: string;
  to?: string;
}): Promise<DashboardSummary> {
  const data = await graphqlRequest<{ dashboardSummary: DashboardSummary }>(
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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

export async function getIssueDetail(issueId: string): Promise<Issue> {
  const data = await graphqlRequest<{ issueDetail: Issue }>(
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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
    opslensApiUrl,
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

export async function getLogAnalysisSessions(): Promise<LogAnalysisSession[]> {
  const data = await graphqlRequest<{ logAnalysisSessions: LogAnalysisSession[] }>(
    opslensApiUrl,
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
    opslensApiUrl,
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
        generatedAt
      }
    }
  `
  );

  return data.reportSnapshots;
}

export async function getOpsSettings(): Promise<OpsSetting[]> {
  const data = await graphqlRequest<{ opsSettings: OpsSetting[] }>(
    opslensApiUrl,
    `
    query OpsSettings {
      opsSettings {
        id
        key
        value
        description
        updatedBy
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
  updatedBy?: string;
}): Promise<OpsSetting> {
  const data = await graphqlRequest<{ upsertOpsSetting: OpsSetting }>(
    opslensApiUrl,
    `
    mutation UpsertOpsSetting($input: UpsertOpsSettingInput!) {
      upsertOpsSetting(input: $input) {
        id
        key
        value
        description
        updatedBy
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
    opslensApiUrl,
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
