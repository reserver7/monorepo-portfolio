import { createQueryKeys, graphqlRequest } from "@repo/react-query";

const OPSLENS_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100/graphql";

export type Severity = "critical" | "high" | "medium" | "low";
export type IssueStatus = "new" | "analyzing" | "in_progress" | "resolved";
export type Environment = "dev" | "stage" | "prod";

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
  qaScenarios: () => opslensKeysBase.custom("qa-scenarios")
};

export type DashboardSummary = {
  todayIssueCount: number;
  severityDistribution: Array<{ severity: Severity; count: number }>;
  errorTrend24h: Array<{ hour: string; count: number }>;
  topRepeatedErrors: Array<{ issueId: string; title: string; severity: Severity; count: number }>;
  newAfterLatestDeployment: Array<{ issueId: string; title: string; severity: Severity; count: number }>;
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
  deployedAt: string;
};

export type DeploymentImpactReport = {
  version: string;
  environment: Environment;
  deployedAt: string;
  increasedIssueCount: number;
  totalAfterErrorCount: number;
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

export type QaScenario = {
  id: string;
  featureName: string;
  generatedCases: string[];
  riskPoints: string[];
  regressionTargets: string[];
  audience: string;
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
    OPSLENS_API_URL,
    `
    query DashboardSummary($filter: DashboardFilterInput) {
      dashboardSummary(filter: $filter) {
        todayIssueCount
        severityDistribution { severity count }
        errorTrend24h { hour count }
        topRepeatedErrors { issueId title severity count }
        newAfterLatestDeployment { issueId title severity count }
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
}): Promise<{ createdIssues: number; updatedIssues: number; clusters: ErrorCluster[] }> {
  const data = await graphqlRequest<{
    analyzeLogs: { createdIssues: number; updatedIssues: number; clusters: ErrorCluster[] };
  }>(
    OPSLENS_API_URL,
    `
    mutation AnalyzeLogs($input: AnalyzeLogsInputModel!) {
      analyzeLogs(input: $input) {
        createdIssues
        updatedIssues
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
    { successMessage: "로그 분석이 완료되었습니다." }
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
    OPSLENS_API_URL,
    `
    query Issues($filter: IssueFilterInput) {
      issues(filter: $filter) {
        items {
          id
          title
          severity
          status
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
    OPSLENS_API_URL,
    `
    query IssueDetail($issueId: String!) {
      issueDetail(issueId: $issueId) {
        id
        title
        severity
        status
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
    OPSLENS_API_URL,
    `
    mutation UpdateIssueStatus($input: UpdateIssueStatusInput!) {
      updateIssueStatus(input: $input) {
        id
        title
        status
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
    OPSLENS_API_URL,
    `
    mutation AssignIssue($input: AssignIssueInput!) {
      assignIssue(input: $input) {
        id
        title
        status
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
    OPSLENS_API_URL,
    `
    mutation AddIssueComment($input: AddIssueCommentInput!) {
      addIssueComment(input: $input) {
        id
        title
        status
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
  deployedAt?: string;
}): Promise<Deployment> {
  const data = await graphqlRequest<{ registerDeployment: Deployment }>(
    OPSLENS_API_URL,
    `
    mutation RegisterDeployment($input: RegisterDeploymentInput!) {
      registerDeployment(input: $input) {
        id
        version
        environment
        changelog
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
    OPSLENS_API_URL,
    `
    query Deployments($environment: String) {
      deployments(environment: $environment) {
        id
        version
        environment
        changelog
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
    OPSLENS_API_URL,
    `
    query DeploymentImpact($input: DeploymentImpactInput!) {
      deploymentImpact(input: $input) {
        version
        environment
        deployedAt
        increasedIssueCount
        totalAfterErrorCount
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
    OPSLENS_API_URL,
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

export async function generateQaScenario(input: {
  featureName: string;
  changedScreens: string;
  relatedApis: string;
  releaseNote: string;
  audience: string;
}): Promise<QaScenario> {
  const data = await graphqlRequest<{ generateQaScenario: QaScenario }>(
    OPSLENS_API_URL,
    `
    mutation GenerateQaScenario($input: QaAssistantInputModel!) {
      generateQaScenario(input: $input) {
        id
        featureName
        generatedCases
        riskPoints
        regressionTargets
        audience
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
    OPSLENS_API_URL,
    `
    query RecentQaScenarios {
      recentQaScenarios {
        id
        featureName
        generatedCases
        riskPoints
        regressionTargets
        audience
        createdAt
      }
    }
  `
  );

  return data.recentQaScenarios;
}
