import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { env } from "../../config/env.js";
import { PrismaService } from "../../integration/db/prisma.service.js";
import { AiService } from "../ai/ai.service.js";
import type { DashboardFilterInput } from "./ops.inputs.js";
import { buildIssueWhere, toEnvironment } from "./ops.filters.js";
import { toIssueTitleKey } from "./ops.mappers.js";
import type { DashboardSummaryType, ServiceHealthType } from "./ops.types.js";

@Injectable()
export class OpsDashboardService {
  private readonly dashboardBriefingCache = new Map<string, { value: string; expiresAt: number }>();
  private readonly dashboardSummaryCache = new Map<string, { value: DashboardSummaryType; expiresAt: number }>();
  private readonly logger = new Logger(OpsDashboardService.name);
  private readonly cacheStats = {
    dashboardSummaryHit: 0,
    dashboardSummaryMiss: 0
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  clearCache(): void {
    this.dashboardSummaryCache.clear();
    this.dashboardBriefingCache.clear();
  }

  private logCacheStats(): void {
    if (process.env.NODE_ENV !== "development") return;
    const total = this.cacheStats.dashboardSummaryHit + this.cacheStats.dashboardSummaryMiss;
    if (total % 50 !== 0) return;

    this.logger.debug(
      `[cache] dashboardSummary h/m=${this.cacheStats.dashboardSummaryHit}/${this.cacheStats.dashboardSummaryMiss}`
    );
  }

  private async generateBriefingText(input: {
    todayIssueCount: number;
    criticalCount: number;
    topIssueTitle?: string;
    newAfterDeployCount: number;
  }): Promise<string> {
    const fallback = `오늘 이슈 ${input.todayIssueCount}건, 치명도 critical ${input.criticalCount}건입니다. ${
      input.topIssueTitle
        ? `가장 반복된 이슈는 '${input.topIssueTitle}' 입니다.`
        : "반복 이슈 상위를 우선 확인해 주세요."
    } 배포 이후 신규 증가 이슈는 ${input.newAfterDeployCount}건입니다.`;

    return this.aiService.generateText(
      [
        "당신은 운영 브리핑 도우미입니다.",
        "아래 지표를 3문장으로 간결하게 요약하세요.",
        `오늘 이슈 수: ${input.todayIssueCount}`,
        `critical 수: ${input.criticalCount}`,
        `최상위 반복 이슈: ${input.topIssueTitle ?? "없음"}`,
        `배포 이후 신규 이슈 수: ${input.newAfterDeployCount}`,
        "출력은 한국어로 작성하세요."
      ].join("\n"),
      fallback
    );
  }

  private getDashboardBriefingCacheKey(input: {
    todayIssueCount: number;
    criticalCount: number;
    topIssueTitle?: string;
    newAfterDeployCount: number;
  }): string {
    return [
      input.todayIssueCount,
      input.criticalCount,
      input.topIssueTitle ?? "-",
      input.newAfterDeployCount
    ].join("|");
  }

  private readDashboardBriefingCache(key: string): string | null {
    const hit = this.dashboardBriefingCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      this.dashboardBriefingCache.delete(key);
      return null;
    }
    return hit.value;
  }

  private writeDashboardBriefingCache(key: string, value: string): void {
    this.dashboardBriefingCache.set(key, { value, expiresAt: Date.now() + env.OPS_CACHE_DASHBOARD_BRIEFING_TTL_MS });
    if (this.dashboardBriefingCache.size > env.OPS_CACHE_DASHBOARD_BRIEFING_MAX) {
      const oldest = this.dashboardBriefingCache.keys().next().value as string | undefined;
      if (oldest) this.dashboardBriefingCache.delete(oldest);
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private async generateBriefingTextFast(input: {
    todayIssueCount: number;
    criticalCount: number;
    topIssueTitle?: string;
    newAfterDeployCount: number;
  }): Promise<string> {
    const key = this.getDashboardBriefingCacheKey(input);
    const cached = this.readDashboardBriefingCache(key);
    if (cached) return cached;

    const fallback = `오늘 이슈 ${input.todayIssueCount}건, 치명도 critical ${input.criticalCount}건입니다. ${
      input.topIssueTitle
        ? `가장 반복된 이슈는 '${input.topIssueTitle}' 입니다.`
        : "반복 이슈 상위를 우선 확인해 주세요."
    } 배포 이후 신규 증가 이슈는 ${input.newAfterDeployCount}건입니다.`;

    const aiTask = this.generateBriefingText(input).catch(() => fallback);
    const fastResult = await Promise.race([
      aiTask,
      this.wait(450).then(() => fallback)
    ]);

    this.writeDashboardBriefingCache(key, fastResult);
    return fastResult;
  }

  private getDashboardSummaryCacheKey(filter?: DashboardFilterInput): string {
    return JSON.stringify({
      environment: filter?.environment ?? null,
      serviceName: filter?.serviceName ?? null,
      query: filter?.query ?? null,
      from: filter?.from ?? null,
      to: filter?.to ?? null
    });
  }

  private readDashboardSummaryCache(key: string): DashboardSummaryType | null {
    const hit = this.dashboardSummaryCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      this.dashboardSummaryCache.delete(key);
      return null;
    }
    return hit.value;
  }

  private writeDashboardSummaryCache(key: string, value: DashboardSummaryType): void {
    this.dashboardSummaryCache.set(key, { value, expiresAt: Date.now() + env.OPS_CACHE_DASHBOARD_SUMMARY_TTL_MS });
    if (this.dashboardSummaryCache.size > env.OPS_CACHE_DASHBOARD_SUMMARY_MAX) {
      const oldest = this.dashboardSummaryCache.keys().next().value as string | undefined;
      if (oldest) this.dashboardSummaryCache.delete(oldest);
    }
  }

  async getDashboardSummary(filter?: DashboardFilterInput): Promise<DashboardSummaryType> {
    const cacheKey = this.getDashboardSummaryCacheKey(filter);
    const cached = this.readDashboardSummaryCache(cacheKey);
    if (cached) {
      this.cacheStats.dashboardSummaryHit += 1;
      this.logCacheStats();
      return cached;
    }
    this.cacheStats.dashboardSummaryMiss += 1;
    this.logCacheStats();

    const issueWhere = buildIssueWhere(filter);
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const to = filter?.to ? new Date(filter.to) : now;
    const from = filter?.from ? new Date(filter.from) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const deploymentWhere: Prisma.DeploymentWhereInput = {};
    const environment = toEnvironment(filter?.environment);
    if (environment) deploymentWhere.environment = environment;

    const trendConditions: Prisma.Sql[] = [Prisma.sql`le."occurredAt" >= ${from}`, Prisma.sql`le."occurredAt" <= ${to}`];
    if (environment) {
      trendConditions.push(Prisma.sql`i."environment" = ${environment}::"OpsEnvironment"`);
    }
    if (filter?.serviceName) {
      trendConditions.push(Prisma.sql`i."serviceName" ILIKE ${`%${filter.serviceName}%`}`);
    }
    if (filter?.query) {
      const queryValue = `%${filter.query}%`;
      trendConditions.push(
        Prisma.sql`(
          i."title" ILIKE ${queryValue}
          OR i."summary" ILIKE ${queryValue}
          OR i."serviceName" ILIKE ${queryValue}
        )`
      );
    }

    const trendWhereSql = trendConditions.length > 0 ? Prisma.join(trendConditions, " AND ") : Prisma.sql`TRUE`;

    const [todayIssueCount, severityRows, trendRows, topRepeatedIssues, latestDeployment] = await Promise.all([
      this.prisma.issue.count({
        where: {
          ...issueWhere,
          updatedAt: { gte: startOfDay }
        }
      }),
      this.prisma.issue.groupBy({
        by: ["severity"],
        where: issueWhere,
        _count: { severity: true }
      }),
      this.prisma.$queryRaw<Array<{ hour_bucket: Date; count: bigint }>>(Prisma.sql`
        SELECT
          date_trunc('hour', le."occurredAt") AS hour_bucket,
          COUNT(*)::bigint AS count
        FROM "LogEvent" le
        INNER JOIN "Issue" i ON i."id" = le."issueId"
        WHERE ${trendWhereSql}
        GROUP BY 1
      `),
      this.prisma.issue.findMany({
        where: issueWhere,
        orderBy: [{ occurrenceCount: "desc" }, { lastOccurredAt: "desc" }],
        take: 5
      }),
      this.prisma.deployment.findFirst({
        where: deploymentWhere,
        orderBy: { deployedAt: "desc" }
      })
    ]);

    const severityDistribution = ["critical", "high", "medium", "low"].map((severity) => ({
      severity,
      count: severityRows.find((row) => row.severity === severity)?._count.severity ?? 0
    }));

    const hourlyMap = new Map<string, number>();
    for (let i = 23; i >= 0; i -= 1) {
      const d = new Date(to.getTime() - i * 60 * 60 * 1000);
      const key = `${d.getHours().toString().padStart(2, "0")}:00`;
      hourlyMap.set(key, 0);
    }

    for (const row of trendRows) {
      const key = `${new Date(row.hour_bucket).getHours().toString().padStart(2, "0")}:00`;
      if (hourlyMap.has(key)) hourlyMap.set(key, (hourlyMap.get(key) ?? 0) + 1);
    }

    const errorTrend24h = Array.from(hourlyMap.entries()).map(([hour, count]) => ({ hour, count }));
    const topRepeatedErrors = topRepeatedIssues.map((issue) => ({
      issueId: issue.id,
      title: issue.title,
      titleKey: toIssueTitleKey(issue.title),
      severity: issue.severity,
      count: issue.occurrenceCount
    }));

    const newAfterIssues = latestDeployment
      ? await this.prisma.issue.findMany({
          where: {
            ...issueWhere,
            firstOccurredAt: { gte: latestDeployment.deployedAt }
          },
          orderBy: [{ occurrenceCount: "desc" }, { firstOccurredAt: "desc" }],
          take: 5
        })
      : [];

    const newAfterLatestDeployment = newAfterIssues.map((issue) => ({
      issueId: issue.id,
      title: issue.title,
      titleKey: toIssueTitleKey(issue.title),
      severity: issue.severity,
      count: issue.occurrenceCount
    }));

    const aiBriefing = await this.generateBriefingTextFast({
      todayIssueCount,
      criticalCount: severityDistribution.find((item) => item.severity === "critical")?.count ?? 0,
      topIssueTitle: topRepeatedErrors[0]?.title,
      newAfterDeployCount: newAfterLatestDeployment.length
    });

    const summary: DashboardSummaryType = {
      todayIssueCount,
      severityDistribution,
      errorTrend24h,
      topRepeatedErrors,
      newAfterLatestDeployment,
      aiBriefing
    };

    this.writeDashboardSummaryCache(cacheKey, summary);
    return summary;
  }

  async getServiceHealth(filter?: DashboardFilterInput): Promise<ServiceHealthType[]> {
    const issues = await this.prisma.issue.findMany({
      where: buildIssueWhere(filter),
      select: { serviceName: true, severity: true, status: true, lastOccurredAt: true }
    });
    const services = new Map<string, ServiceHealthType>();
    for (const issue of issues) {
      const current = services.get(issue.serviceName) ?? {
        serviceName: issue.serviceName,
        status: "healthy",
        openIssueCount: 0,
        criticalHighCount: 0,
        lastOccurredAt: null
      };
      if (issue.status !== "resolved") current.openIssueCount += 1;
      if (issue.status !== "resolved" && (issue.severity === "critical" || issue.severity === "high")) current.criticalHighCount += 1;
      if (!current.lastOccurredAt || current.lastOccurredAt < issue.lastOccurredAt) current.lastOccurredAt = issue.lastOccurredAt;
      current.status = current.criticalHighCount > 0 ? "incident" : current.openIssueCount > 0 ? "degraded" : "healthy";
      services.set(issue.serviceName, current);
    }
    return [...services.values()].sort((a, b) => b.criticalHighCount - a.criticalHighCount || b.openIssueCount - a.openIssueCount || a.serviceName.localeCompare(b.serviceName));
  }

  async aiBriefing(filter?: DashboardFilterInput): Promise<string> {
    const summary = await this.getDashboardSummary(filter);
    return summary.aiBriefing;
  }
}
