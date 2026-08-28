import { createQueryKeys } from "@repo/react-query";
import type { Environment, IssueListFilterParams, OpsFilterParams } from "./types";

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
  issueSummary: (filter: IssueListFilterParams) =>
    opslensKeysBase.custom(
      "issue-summary",
      filter.environment,
      filter.serviceName,
      filter.search,
      filter.status,
      filter.severity
    ),
  issueDetail: (issueId: string) => opslensKeysBase.custom("issue-detail", issueId),
  serviceHealth: (filter: OpsFilterParams) => opslensKeysBase.custom("service-health", filter.environment, filter.serviceName, filter.search),
  serviceSlo: (serviceName: string, environment: Environment) => opslensKeysBase.custom("service-slo", serviceName, environment),
  incidentTimeline: (issueId: string) => opslensKeysBase.custom("incident-timeline", issueId),
  deployments: (environment: Environment) => opslensKeysBase.custom("deployments", environment),
  deploymentImpact: (environment: Environment, version?: string) =>
    opslensKeysBase.custom("deployment-impact", environment, version),
  deploymentReadiness: (environment: Environment) => opslensKeysBase.custom("deployment-readiness", environment),
  qaScenarios: () => opslensKeysBase.custom("qa-scenarios"),
  alerts: () => opslensKeysBase.custom("alerts"),
  logAnalysisSessions: () => opslensKeysBase.custom("log-analysis-sessions"),
  logSourceFreshness: () => opslensKeysBase.custom("log-source-freshness"),
  logSavedViews: () => opslensKeysBase.custom("log-saved-views"),
  reportSnapshots: () => opslensKeysBase.custom("report-snapshots"),
  reportActions: (snapshotId: string) => opslensKeysBase.custom("report-actions", snapshotId),
  settings: () => opslensKeysBase.custom("settings"),
  auditLogs: () => opslensKeysBase.custom("audit-logs"),
  users: () => opslensKeysBase.custom("users"),
  notificationDeliveries: () => opslensKeysBase.custom("notification-deliveries")
};
