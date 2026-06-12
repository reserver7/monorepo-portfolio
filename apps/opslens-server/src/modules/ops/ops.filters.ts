import { BadRequestException } from "@nestjs/common";
import { IssueSeverity, IssueStatus, LogSource, OpsEnvironment, Prisma } from "@prisma/client";

import type { DashboardFilterInput, IssueFilterInput } from "./ops.inputs.js";

export const toEnvironment = (value?: string): OpsEnvironment | undefined => {
  if (!value) return undefined;
  if (value === "dev" || value === "stage" || value === "prod") return value;
  throw new BadRequestException("environment 값은 dev/stage/prod 중 하나여야 합니다.");
};

export const toSeverity = (value?: string): IssueSeverity | undefined => {
  if (!value) return undefined;
  if (value === "critical" || value === "high" || value === "medium" || value === "low") return value;
  throw new BadRequestException("severity 값이 올바르지 않습니다.");
};

export const toStatus = (value?: string): IssueStatus | undefined => {
  if (!value) return undefined;
  if (value === "new" || value === "analyzing" || value === "in_progress" || value === "resolved") return value;
  throw new BadRequestException("status 값이 올바르지 않습니다.");
};

export const toLogSource = (value?: string): LogSource => {
  if (
    value === "server" ||
    value === "client" ||
    value === "api" ||
    value === "console" ||
    value === "sentry"
  ) {
    return value;
  }
  return "server";
};

export const buildIssueWhere = (filter?: DashboardFilterInput | IssueFilterInput): Prisma.IssueWhereInput => {
  const where: Prisma.IssueWhereInput = {};

  const environment = toEnvironment(filter?.environment);
  const severity = toSeverity((filter as IssueFilterInput | undefined)?.severity);
  const status = toStatus((filter as IssueFilterInput | undefined)?.status);

  if (environment) where.environment = environment;
  if (filter?.serviceName) where.serviceName = { contains: filter.serviceName, mode: "insensitive" };
  if (severity) where.severity = severity;
  if (status) where.status = status;

  if (filter?.query) {
    where.OR = [
      { title: { contains: filter.query, mode: "insensitive" } },
      { summary: { contains: filter.query, mode: "insensitive" } },
      { serviceName: { contains: filter.query, mode: "insensitive" } }
    ];
  }

  return where;
};
