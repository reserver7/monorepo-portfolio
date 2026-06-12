import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { env } from "../../config/env.js";
import { PrismaService } from "../../integration/db/prisma.service.js";
import type { DeploymentImpactInput, RegisterDeploymentInput } from "./ops.inputs.js";
import { writeOpsAuditLog } from "./ops-audit-writer.js";
import { toEnvironment } from "./ops.filters.js";
import {
  getDeploymentRecommendedAction,
  getDeploymentRiskLevel,
  normalizeStringList,
  toDeploymentType
} from "./ops.mappers.js";
import type { DeploymentImpactReportType, DeploymentType } from "./ops.types.js";

@Injectable()
export class OpsDeploymentService {
  private readonly deploymentImpactCache = new Map<string, { value: DeploymentImpactReportType; expiresAt: number }>();
  private readonly logger = new Logger(OpsDeploymentService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getDeploymentImpactCacheKey(input: DeploymentImpactInput): string {
    return `${input.environment}|${input.version}`;
  }

  private readDeploymentImpactCache(key: string): DeploymentImpactReportType | null {
    const hit = this.deploymentImpactCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      this.deploymentImpactCache.delete(key);
      return null;
    }
    return hit.value;
  }

  private writeDeploymentImpactCache(key: string, value: DeploymentImpactReportType): void {
    this.deploymentImpactCache.set(key, { value, expiresAt: Date.now() + env.OPS_CACHE_DEPLOYMENT_IMPACT_TTL_MS });
    if (this.deploymentImpactCache.size > env.OPS_CACHE_DEPLOYMENT_IMPACT_MAX) {
      const oldest = this.deploymentImpactCache.keys().next().value as string | undefined;
      if (oldest) this.deploymentImpactCache.delete(oldest);
    }
  }

  clearCache(): void {
    this.deploymentImpactCache.clear();
  }

  async registerDeployment(input: RegisterDeploymentInput): Promise<DeploymentType> {
    const environment = toEnvironment(input.environment);
    if (!environment) {
      throw new BadRequestException("environment 값이 필요합니다.");
    }

    const deployedAt = input.deployedAt ? new Date(input.deployedAt) : new Date();
    const monitoringWindowMin = Math.max(15, Math.min(1440, input.monitoringWindowMin ?? 60));
    const deploymentData = {
      changelog: input.changelog,
      status: input.status?.trim() || "completed",
      owner: input.owner?.trim() || "운영담당자",
      approver: input.approver?.trim() || null,
      scopeTags: normalizeStringList(input.scopeTags) as Prisma.JsonArray,
      checklist: normalizeStringList(input.checklist) as Prisma.JsonArray,
      rollbackCriteria: input.rollbackCriteria?.trim() || null,
      monitoringWindowMin,
      deployedAt
    };

    const deployment = await this.prisma.deployment.upsert({
      where: {
        version_environment: {
          version: input.version,
          environment
        }
      },
      update: deploymentData,
      create: {
        version: input.version,
        environment,
        ...deploymentData
      }
    });

    this.clearCache();
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor: deployment.owner,
      action: "deployment.registered",
      targetType: "Deployment",
      targetId: deployment.id,
      summary: `${deployment.version} 배포 등록/갱신`,
      metadata: { environment: deployment.environment, status: deployment.status }
    });

    return toDeploymentType(deployment);
  }

  async listDeployments(environment?: string): Promise<DeploymentType[]> {
    const envFilter = toEnvironment(environment);
    const deployments = await this.prisma.deployment.findMany({
      where: envFilter ? { environment: envFilter } : undefined,
      orderBy: { deployedAt: "desc" },
      take: 30
    });
    return deployments.map((deployment) => toDeploymentType(deployment));
  }

  async deploymentImpact(input: DeploymentImpactInput): Promise<DeploymentImpactReportType> {
    const cacheKey = this.getDeploymentImpactCacheKey(input);
    const cached = this.readDeploymentImpactCache(cacheKey);
    if (cached) return cached;

    const environment = toEnvironment(input.environment);
    if (!environment) {
      throw new BadRequestException("environment 값이 필요합니다.");
    }

    const deployment = await this.prisma.deployment.findUnique({
      where: {
        version_environment: {
          version: input.version,
          environment
        }
      }
    });

    if (!deployment) {
      throw new NotFoundException("해당 배포 버전을 찾을 수 없습니다.");
    }

    const monitoringWindowMin = deployment.monitoringWindowMin ?? 60;
    const windowMs = monitoringWindowMin * 60 * 1000;
    const beforeStart = new Date(deployment.deployedAt.getTime() - windowMs);
    const afterEnd = new Date(deployment.deployedAt.getTime() + windowMs);

    const candidateIssues = await this.prisma.issue.findMany({
      where: { environment },
      select: {
        id: true,
        title: true,
        severity: true,
        serviceName: true
      },
      take: 40
    });
    const issueIds = candidateIssues.map((item) => item.id);

    const [beforeGrouped, afterGrouped] = await Promise.all([
      issueIds.length === 0
        ? Promise.resolve([])
        : this.prisma.logEvent.groupBy({
            by: ["issueId"],
            where: {
              issueId: { in: issueIds },
              occurredAt: { gte: beforeStart, lt: deployment.deployedAt }
            },
            _count: { _all: true }
          }),
      issueIds.length === 0
        ? Promise.resolve([])
        : this.prisma.logEvent.groupBy({
            by: ["issueId"],
            where: {
              issueId: { in: issueIds },
              occurredAt: { gte: deployment.deployedAt, lte: afterEnd }
            },
            _count: { _all: true }
          })
    ]);
    const beforeCountMap = new Map(beforeGrouped.map((row) => [row.issueId, row._count._all]));
    const afterCountMap = new Map(afterGrouped.map((row) => [row.issueId, row._count._all]));

    const increasedIssues: DeploymentImpactReportType["increasedIssues"] = [];
    let totalAfterErrorCount = 0;

    for (const issue of candidateIssues) {
      const beforeCount = beforeCountMap.get(issue.id) ?? 0;
      const afterCount = afterCountMap.get(issue.id) ?? 0;
      totalAfterErrorCount += afterCount;

      if (afterCount > beforeCount) {
        increasedIssues.push({
          issueId: issue.id,
          title: issue.title,
          severity: issue.severity,
          serviceName: issue.serviceName,
          beforeCount,
          afterCount,
          delta: afterCount - beforeCount
        });
      }
    }

    increasedIssues.sort((a, b) => b.delta - a.delta);

    const topIncreasedIssue = increasedIssues[0];
    const riskLevel = getDeploymentRiskLevel({ increasedIssues, totalAfterErrorCount });
    const recommendedAction = getDeploymentRecommendedAction(riskLevel);
    const summary = !topIncreasedIssue
      ? `배포 전후 ${monitoringWindowMin}분 비교에서 유의미한 증가 이슈가 발견되지 않았습니다.`
      : `배포 이후 증가 이슈 ${increasedIssues.length}건이 감지되었고, 가장 큰 증가 이슈는 '${topIncreasedIssue.title}' 입니다.`;

    const report: DeploymentImpactReportType = {
      version: deployment.version,
      environment: deployment.environment,
      deployedAt: deployment.deployedAt,
      increasedIssueCount: increasedIssues.length,
      totalAfterErrorCount,
      riskLevel,
      recommendedAction,
      monitoringWindowMin,
      increasedIssues: increasedIssues.slice(0, 10),
      summary
    };

    this.writeDeploymentImpactCache(cacheKey, report);
    return report;
  }
}
