import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  IssueSeverity,
  IssueStatus,
  LogSource,
  OpsEnvironment,
  Prisma,
  type Deployment,
  type Issue,
  type IssueComment,
  type LogEvent,
  type QaScenario
} from "@prisma/client";
import { env } from "../../config/env.js";
import { PrismaService } from "../../integration/db/prisma.service.js";
import { AiService } from "../ai/ai.service.js";
import {
  type AddIssueCommentInput,
  type AnalyzeLogsInputModel,
  type AssignIssueInput,
  type CreateOpsAlertInput,
  type DashboardFilterInput,
  type DeploymentImpactInput,
  type IssueFilterInput,
  type OpsAuditLogFilterInput,
  type QaAssistantInputModel,
  type RegisterDeploymentInput,
  type UpsertOpsSettingInput,
  type UpdateReportSnapshotInput,
  type UpdateIssueStatusInput
} from "./ops.inputs.js";
import { clusterLogs, parseLogLines } from "./log-parser.js";
import type {
  AnalyzeLogsPayloadType,
  DashboardSummaryType,
  DeploymentImpactReportType,
  DeploymentType,
  IssueListPayloadType,
  IssueType,
  LogAnalysisSessionType,
  OpsAuditLogType,
  OpsAlertType,
  OpsReportType,
  OpsReportSnapshotType,
  OpsSettingType,
  QaScenarioType
} from "./ops.types.js";

@Injectable()
export class OpsService {
  private readonly dashboardBriefingCache = new Map<string, { value: string; expiresAt: number }>();
  private readonly dashboardSummaryCache = new Map<string, { value: DashboardSummaryType; expiresAt: number }>();
  private readonly deploymentImpactCache = new Map<string, { value: DeploymentImpactReportType; expiresAt: number }>();
  private readonly issueListCache = new Map<string, { value: IssueListPayloadType; expiresAt: number }>();
  private readonly qaScenarioListCache = new Map<string, { value: QaScenarioType[]; expiresAt: number }>();
  private readonly logger = new Logger(OpsService.name);
  private readonly cacheStats = {
    dashboardSummaryHit: 0,
    dashboardSummaryMiss: 0,
    deploymentImpactHit: 0,
    deploymentImpactMiss: 0,
    issueListHit: 0,
    issueListMiss: 0,
    qaScenarioHit: 0,
    qaScenarioMiss: 0
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  private logCacheStats(): void {
    if (process.env.NODE_ENV !== "development") return;
    const total =
      this.cacheStats.dashboardSummaryHit +
      this.cacheStats.dashboardSummaryMiss +
      this.cacheStats.deploymentImpactHit +
      this.cacheStats.deploymentImpactMiss +
      this.cacheStats.issueListHit +
      this.cacheStats.issueListMiss +
      this.cacheStats.qaScenarioHit +
      this.cacheStats.qaScenarioMiss;
    if (total % 50 !== 0) return;

    this.logger.debug(
      `[cache] dashboardSummary h/m=${this.cacheStats.dashboardSummaryHit}/${this.cacheStats.dashboardSummaryMiss} ` +
        `deploymentImpact h/m=${this.cacheStats.deploymentImpactHit}/${this.cacheStats.deploymentImpactMiss} ` +
        `issueList h/m=${this.cacheStats.issueListHit}/${this.cacheStats.issueListMiss} ` +
        `qaScenario h/m=${this.cacheStats.qaScenarioHit}/${this.cacheStats.qaScenarioMiss}`
    );
  }

  private toEnvironment(value?: string): OpsEnvironment | undefined {
    if (!value) return undefined;
    if (value === "dev" || value === "stage" || value === "prod") return value;
    throw new BadRequestException("environment 값은 dev/stage/prod 중 하나여야 합니다.");
  }

  private toSeverity(value?: string): IssueSeverity | undefined {
    if (!value) return undefined;
    if (value === "critical" || value === "high" || value === "medium" || value === "low") return value;
    throw new BadRequestException("severity 값이 올바르지 않습니다.");
  }

  private toStatus(value?: string): IssueStatus | undefined {
    if (!value) return undefined;
    if (value === "new" || value === "analyzing" || value === "in_progress" || value === "resolved")
      return value;
    throw new BadRequestException("status 값이 올바르지 않습니다.");
  }

  private toLogSource(value?: string): LogSource {
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
  }

  private buildIssueWhere(filter?: DashboardFilterInput | IssueFilterInput): Prisma.IssueWhereInput {
    const where: Prisma.IssueWhereInput = {};

    const environment = this.toEnvironment(filter?.environment);
    const severity = this.toSeverity((filter as IssueFilterInput | undefined)?.severity);
    const status = this.toStatus((filter as IssueFilterInput | undefined)?.status);

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
  }

  private parseArray(value: Prisma.JsonValue): string[] {
    if (Array.isArray(value)) return value.map((item) => String(item));
    return [];
  }

  private async writeAuditLog(input: {
    actor?: string;
    action: string;
    targetType: string;
    targetId?: string | null;
    severity?: string;
    summary: string;
    beforeValue?: Prisma.InputJsonValue | null;
    afterValue?: Prisma.InputJsonValue | null;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void> {
    await this.prisma.opsAuditLog.create({
      data: {
        actor: input.actor?.trim() || "system",
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        severity: input.severity ?? "info",
        summary: input.summary,
        beforeValue: input.beforeValue ?? undefined,
        afterValue: input.afterValue ?? undefined,
        metadata: input.metadata ?? {}
      }
    }).catch((error) => {
      this.logger.warn(`[audit] failed action=${input.action} target=${input.targetType}:${input.targetId ?? "-"} ${String(error)}`);
    });
  }

  private toIssueTitleKey(title: string): string | undefined {
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
  }

  private toIssueType(
    issue: Issue & { deployment: Deployment | null; comments?: IssueComment[]; logs?: LogEvent[] }
  ): IssueType {
    return {
      id: issue.id,
      title: issue.title,
      severity: issue.severity,
      status: issue.status,
      priority: issue.priority,
      slaDueAt: issue.slaDueAt,
      escalationLevel: issue.escalationLevel,
      summary: issue.summary,
      probableCauses: this.parseArray(issue.probableCauses),
      suggestedActions: this.parseArray(issue.suggestedActions),
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
    };
  }

  private toQaScenarioType(scenario: QaScenario): QaScenarioType {
    return {
      id: scenario.id,
      featureName: scenario.featureName,
      generatedCases: this.parseArray(scenario.generatedCases),
      riskPoints: this.parseArray(scenario.riskPoints),
      regressionTargets: this.parseArray(scenario.regressionTargets),
      audience: scenario.audience,
      status: scenario.status,
      owner: scenario.owner,
      reviewer: scenario.reviewer,
      executionStatus: scenario.executionStatus,
      executedAt: scenario.executedAt,
      notes: scenario.notes,
      createdAt: scenario.createdAt
    };
  }

  private toOpsAlertType(alert: {
    id: string;
    level: IssueSeverity;
    title: string;
    message: string;
    source: string;
    link: string | null;
    readAt: Date | null;
    createdAt: Date;
  }): OpsAlertType {
    return {
      id: alert.id,
      level: alert.level,
      title: alert.title,
      message: alert.message,
      source: alert.source,
      link: alert.link,
      readAt: alert.readAt,
      createdAt: alert.createdAt
    };
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
    if (cached) {
      return cached;
    }

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

  private clearDashboardCaches(): void {
    this.dashboardSummaryCache.clear();
    this.dashboardBriefingCache.clear();
  }

  private getDeploymentImpactCacheKey(input: DeploymentImpactInput): string {
    return `${input.environment}|${input.version}`;
  }

  private normalizeStringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
  }

  private toDeploymentType(deployment: Deployment): DeploymentType {
    return {
      ...deployment,
      scopeTags: this.normalizeStringList(deployment.scopeTags),
      checklist: this.normalizeStringList(deployment.checklist)
    };
  }

  private getDeploymentRiskLevel(report: {
    increasedIssues: DeploymentImpactReportType["increasedIssues"];
    totalAfterErrorCount: number;
  }): "normal" | "caution" | "rollback_review" {
    const hasCriticalIncrease = report.increasedIssues.some((issue) => issue.severity === IssueSeverity.critical);
    const hasHighVolume = report.totalAfterErrorCount >= 100;
    if (hasCriticalIncrease || report.increasedIssues.length >= 5 || hasHighVolume) return "rollback_review";
    if (report.increasedIssues.length > 0 || report.totalAfterErrorCount >= 30) return "caution";
    return "normal";
  }

  private getDeploymentRecommendedAction(riskLevel: string): string {
    if (riskLevel === "rollback_review") return "Critical 증가 또는 높은 에러량이 감지되었습니다. 담당자 확인 후 롤백 여부를 검토하세요.";
    if (riskLevel === "caution") return "배포 후 증가 신호가 있습니다. 모니터링 윈도우 동안 관련 이슈를 우선 확인하세요.";
    return "배포 후 증가 신호가 낮습니다. 설정한 모니터링 윈도우까지 추적을 유지하세요.";
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

  private clearDerivedCaches(): void {
    this.clearDashboardCaches();
    this.deploymentImpactCache.clear();
    this.issueListCache.clear();
    this.qaScenarioListCache.clear();
  }

  private readQaScenarioListCache(): QaScenarioType[] | null {
    const key = "recent";
    const hit = this.qaScenarioListCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      this.qaScenarioListCache.delete(key);
      return null;
    }
    return hit.value;
  }

  private writeQaScenarioListCache(value: QaScenarioType[]): void {
    this.qaScenarioListCache.set("recent", { value, expiresAt: Date.now() + env.OPS_CACHE_QA_SCENARIO_TTL_MS });
  }

  private getIssueListCacheKey(filter?: IssueFilterInput): string {
    return JSON.stringify({
      environment: filter?.environment ?? null,
      serviceName: filter?.serviceName ?? null,
      query: filter?.query ?? null,
      severity: filter?.severity ?? null,
      status: filter?.status ?? null,
      page: filter?.page ?? 1,
      pageSize: filter?.pageSize ?? 20
    });
  }

  private readIssueListCache(key: string): IssueListPayloadType | null {
    const hit = this.issueListCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      this.issueListCache.delete(key);
      return null;
    }
    return hit.value;
  }

  private writeIssueListCache(key: string, value: IssueListPayloadType): void {
    this.issueListCache.set(key, { value, expiresAt: Date.now() + env.OPS_CACHE_ISSUE_LIST_TTL_MS });
    if (this.issueListCache.size > env.OPS_CACHE_ISSUE_LIST_MAX) {
      const oldest = this.issueListCache.keys().next().value as string | undefined;
      if (oldest) this.issueListCache.delete(oldest);
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

    const issueWhere = this.buildIssueWhere(filter);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const to = filter?.to ? new Date(filter.to) : now;
    const from = filter?.from ? new Date(filter.from) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const deploymentWhere: Prisma.DeploymentWhereInput = {};
    const environment = this.toEnvironment(filter?.environment);
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
      titleKey: this.toIssueTitleKey(issue.title),
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
      titleKey: this.toIssueTitleKey(issue.title),
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

  async getOpsReport(filter?: DashboardFilterInput): Promise<OpsReportType> {
    const summary = await this.getDashboardSummary(filter);
    const issues = await this.prisma.issue.findMany({
      where: this.buildIssueWhere(filter),
      orderBy: [{ severity: "asc" }, { occurrenceCount: "desc" }, { lastOccurredAt: "desc" }],
      take: 5
    });
    const criticalCount = summary.severityDistribution.find((item) => item.severity === "critical")?.count ?? 0;
    const highCount = summary.severityDistribution.find((item) => item.severity === "high")?.count ?? 0;
    const deployRiskCount = summary.newAfterLatestDeployment.length;
    const topIssue = issues[0];
    const riskLevel = criticalCount > 0 || deployRiskCount >= 3 ? "critical" : highCount > 0 || deployRiskCount > 0 ? "warning" : "normal";
    const environment = filter?.environment ?? "all";
    const generatedAt = new Date().toISOString();
    const title = `[${environment}] 운영 리포트`;
    const executiveSummary = [
      `오늘 이슈 ${summary.todayIssueCount}건, Critical ${criticalCount}건, High ${highCount}건입니다.`,
      deployRiskCount > 0
        ? `배포 이후 신규 증가 이슈 ${deployRiskCount}건이 있어 배포 영향 확인이 필요합니다.`
        : "배포 이후 신규 증가 이슈는 감지되지 않았습니다.",
      topIssue ? `최우선 확인 대상은 '${topIssue.title}'입니다.` : "현재 우선 대응 이슈는 없습니다."
    ].join(" ");
    const technicalSummary = [
      `Top repeated errors: ${summary.topRepeatedErrors.map((item) => `${item.title}(${item.count})`).join(", ") || "없음"}`,
      `Severity distribution: ${summary.severityDistribution.map((item) => `${item.severity}:${item.count}`).join(", ")}`
    ].join("\n");
    const actionItems = [
      ...(topIssue
        ? [{
            title: "최우선 이슈 담당자 지정",
            description: `${topIssue.title} 상태와 담당자를 확인하고 대응 계획을 남깁니다.`,
            owner: topIssue.assignee || "운영담당자",
            priority: topIssue.severity === IssueSeverity.critical ? "P0" : "P1"
          }]
        : []),
      ...(deployRiskCount > 0
        ? [{
            title: "배포 영향 확인",
            description: "최근 배포 이후 증가한 이슈를 배포 변경 범위와 대조합니다.",
            owner: "배포담당자",
            priority: "P1"
          }]
        : []),
      {
        title: "공유 리포트 전파",
        description: "Slack/Jira에 요약과 액션 아이템을 공유하고 후속 상태를 갱신합니다.",
        owner: "운영담당자",
        priority: "P2"
      }
    ];
    const shareText = [
      title,
      executiveSummary,
      "",
      "[KPI]",
      `- 오늘 이슈: ${summary.todayIssueCount}`,
      `- Critical/High: ${criticalCount}/${highCount}`,
      `- 배포 이후 증가: ${deployRiskCount}`,
      "",
      "[Action]",
      ...actionItems.map((item) => `- ${item.priority} ${item.title}: ${item.owner}`)
    ].join("\n");

    const report: OpsReportType = {
      title,
      generatedAt,
      riskLevel,
      executiveSummary,
      technicalSummary,
      shareText,
      kpis: [
        { label: "오늘 이슈", value: String(summary.todayIssueCount), helper: "현재 필터 기준", tone: summary.todayIssueCount > 0 ? "warning" : "default" },
        { label: "Critical / High", value: `${criticalCount} / ${highCount}`, helper: "즉시 확인 대상", tone: criticalCount > 0 ? "danger" : highCount > 0 ? "warning" : "default" },
        { label: "배포 이후 증가", value: String(deployRiskCount), helper: "최근 배포 영향", tone: deployRiskCount > 0 ? "warning" : "default" }
      ],
      actionItems,
      priorityIssues: issues.map((issue) => ({
        issueId: issue.id,
        title: issue.title,
        severity: issue.severity,
        status: issue.status,
        serviceName: issue.serviceName,
        occurrenceCount: issue.occurrenceCount
      }))
    };

    const snapshot = await this.prisma.opsReportSnapshot.create({
      data: {
        title,
        environment: this.toEnvironment(filter?.environment),
        riskLevel,
        executiveSummary,
        technicalSummary,
        shareText,
        generatedBy: filter?.serviceName && filter.serviceName !== "all" ? filter.serviceName : "system",
        generatedAt: new Date(generatedAt)
      }
    });
    await this.writeAuditLog({
      action: "report_snapshot.created",
      targetType: "OpsReportSnapshot",
      targetId: snapshot.id,
      summary: `${title} 리포트 스냅샷 생성`,
      metadata: { riskLevel, environment }
    });

    return report;
  }

  async listReportSnapshots(): Promise<OpsReportSnapshotType[]> {
    const snapshots = await this.prisma.opsReportSnapshot.findMany({
      orderBy: [{ pinned: "desc" }, { generatedAt: "desc" }],
      take: 20
    });

    return snapshots.map((snapshot) => ({
      id: snapshot.id,
      title: snapshot.title,
      environment: snapshot.environment,
      riskLevel: snapshot.riskLevel,
      executiveSummary: snapshot.executiveSummary,
      technicalSummary: snapshot.technicalSummary,
      shareText: snapshot.shareText,
      generatedBy: snapshot.generatedBy,
      pinned: snapshot.pinned,
      sharedAt: snapshot.sharedAt,
      generatedAt: snapshot.generatedAt
    }));
  }

  async updateReportSnapshot(input: UpdateReportSnapshotInput): Promise<OpsReportSnapshotType> {
    const data: Prisma.OpsReportSnapshotUpdateInput = {};
    if (typeof input.pinned === "boolean") {
      data.pinned = input.pinned;
    }
    if (input.markShared) {
      data.sharedAt = new Date();
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException("변경할 리포트 스냅샷 값이 필요합니다.");
    }

    const updated = await this.prisma.opsReportSnapshot.update({
      where: { id: input.snapshotId },
      data
    });
    await this.writeAuditLog({
      actor: input.actor,
      action: "report_snapshot.updated",
      targetType: "OpsReportSnapshot",
      targetId: updated.id,
      summary: `${updated.title} 리포트 스냅샷 업데이트`,
      metadata: { pinned: updated.pinned, sharedAt: updated.sharedAt?.toISOString() ?? null }
    });

    return {
      id: updated.id,
      title: updated.title,
      environment: updated.environment,
      riskLevel: updated.riskLevel,
      executiveSummary: updated.executiveSummary,
      technicalSummary: updated.technicalSummary,
      shareText: updated.shareText,
      generatedBy: updated.generatedBy,
      pinned: updated.pinned,
      sharedAt: updated.sharedAt,
      generatedAt: updated.generatedAt
    };
  }

  async deleteReportSnapshot(snapshotId: string, actor?: string): Promise<boolean> {
    const existing = await this.prisma.opsReportSnapshot.findUnique({
      where: { id: snapshotId },
      select: { id: true, title: true }
    });
    if (!existing) {
      throw new NotFoundException("리포트 스냅샷을 찾을 수 없습니다.");
    }
    await this.prisma.opsReportSnapshot.delete({ where: { id: snapshotId } });
    await this.writeAuditLog({
      actor,
      action: "report_snapshot.deleted",
      targetType: "OpsReportSnapshot",
      targetId: existing.id,
      summary: `${existing.title} 리포트 스냅샷 삭제`
    });
    return true;
  }

  async listOpsAlerts(): Promise<OpsAlertType[]> {
    const alerts = await this.prisma.opsAlert.findMany({
      orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
      take: 30
    });
    return alerts.map((alert) => this.toOpsAlertType(alert));
  }

  async createOpsAlert(input: CreateOpsAlertInput): Promise<OpsAlertType> {
    const level = this.toSeverity(input.level);
    if (!level) {
      throw new BadRequestException("level 값이 필요합니다.");
    }
    const created = await this.prisma.opsAlert.create({
      data: {
        level,
        title: input.title.trim(),
        message: input.message.trim(),
        source: input.source.trim() || "system",
        link: input.link?.trim() || null
      }
    });
    await this.writeAuditLog({
      action: "alert.created",
      targetType: "OpsAlert",
      targetId: created.id,
      summary: `${created.title} 알림 생성`,
      metadata: { level: created.level, source: created.source }
    });
    return this.toOpsAlertType(created);
  }

  async markOpsAlertRead(alertId: string): Promise<OpsAlertType> {
    const updated = await this.prisma.opsAlert.update({
      where: { id: alertId },
      data: { readAt: new Date() }
    });
    await this.writeAuditLog({
      action: "alert.read",
      targetType: "OpsAlert",
      targetId: updated.id,
      summary: `${updated.title} 알림 읽음 처리`
    });
    return this.toOpsAlertType(updated);
  }

  async markAllOpsAlertsRead(): Promise<boolean> {
    const result = await this.prisma.opsAlert.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() }
    });
    await this.writeAuditLog({
      action: "alert.read_all",
      targetType: "OpsAlert",
      summary: `읽지 않은 알림 ${result.count}건 전체 읽음 처리`,
      metadata: { count: result.count }
    });
    return true;
  }

  async deleteOpsAlert(alertId: string): Promise<boolean> {
    const existing = await this.prisma.opsAlert.findUnique({
      where: { id: alertId },
      select: { id: true, title: true }
    });
    if (!existing) {
      throw new NotFoundException("알림을 찾을 수 없습니다.");
    }
    await this.prisma.opsAlert.delete({ where: { id: alertId } });
    await this.writeAuditLog({
      action: "alert.deleted",
      targetType: "OpsAlert",
      targetId: existing.id,
      summary: `${existing.title} 알림 삭제`
    });
    return true;
  }

  async listLogAnalysisSessions(): Promise<LogAnalysisSessionType[]> {
    const sessions = await this.prisma.logAnalysisSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return sessions.map((session) => ({
      id: session.id,
      environment: session.environment,
      serviceName: session.serviceName,
      source: session.source,
      requestedBy: session.requestedBy,
      deploymentVersion: session.deploymentVersion,
      rawLineCount: session.rawLineCount,
      clusterTotalCount: session.clusterTotalCount,
      clusterDisplayedCount: session.clusterDisplayedCount,
      createdIssues: session.createdIssues,
      updatedIssues: session.updatedIssues,
      topClusterTitle: session.topClusterTitle,
      createdAt: session.createdAt
    }));
  }

  async listOpsSettings(): Promise<OpsSettingType[]> {
    const settings = await this.prisma.opsSetting.findMany({
      orderBy: { key: "asc" }
    });

    return settings.map((setting) => ({
      id: setting.id,
      key: setting.key,
      value: JSON.stringify(setting.value),
      description: setting.description,
      category: setting.category,
      riskLevel: setting.riskLevel,
      editable: setting.editable,
      updatedBy: setting.updatedBy,
      changeReason: setting.changeReason,
      updatedAt: setting.updatedAt
    }));
  }

  async listOpsAuditLogs(filter?: OpsAuditLogFilterInput): Promise<OpsAuditLogType[]> {
    const where: Prisma.OpsAuditLogWhereInput = {};
    const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
    if (filter?.actor) where.actor = { contains: filter.actor, mode: "insensitive" };
    if (filter?.action) where.action = filter.action;
    if (filter?.targetType) where.targetType = filter.targetType;
    if (filter?.severity) where.severity = filter.severity;
    if (filter?.query) {
      where.OR = [
        { summary: { contains: filter.query, mode: "insensitive" } },
        { action: { contains: filter.query, mode: "insensitive" } },
        { targetType: { contains: filter.query, mode: "insensitive" } }
      ];
    }
    if (filter?.from || filter?.to) {
      where.createdAt = {
        gte: filter.from ? new Date(filter.from) : undefined,
        lte: filter.to ? new Date(filter.to) : undefined
      };
    }

    const logs = await this.prisma.opsAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return logs.map((log) => ({
      id: log.id,
      actor: log.actor,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      severity: log.severity,
      summary: log.summary,
      beforeValue: log.beforeValue == null ? null : JSON.stringify(log.beforeValue),
      afterValue: log.afterValue == null ? null : JSON.stringify(log.afterValue),
      metadata: JSON.stringify(log.metadata),
      createdAt: log.createdAt
    }));
  }

  async upsertOpsSetting(input: UpsertOpsSettingInput): Promise<OpsSettingType> {
    let value: Prisma.InputJsonValue;
    try {
      value = JSON.parse(input.value) as Prisma.InputJsonValue;
    } catch {
      throw new BadRequestException("value는 JSON 문자열이어야 합니다.");
    }

    const previous = await this.prisma.opsSetting.findUnique({ where: { key: input.key } });
    if (previous && !previous.editable) {
      throw new BadRequestException("읽기 전용 운영 설정은 화면에서 수정할 수 없습니다.");
    }

    const category = input.category?.trim() || previous?.category || "general";
    const riskLevel = input.riskLevel?.trim() || previous?.riskLevel || "low";
    const editable = input.editable ?? previous?.editable ?? true;
    const updatedBy = input.updatedBy?.trim() || "operator";
    const changeReason = input.changeReason?.trim() || null;

    const setting = await this.prisma.opsSetting.upsert({
      where: { key: input.key },
      update: {
        value,
        description: input.description?.trim() || null,
        category,
        riskLevel,
        editable,
        updatedBy,
        changeReason
      },
      create: {
        key: input.key,
        value,
        description: input.description?.trim() || null,
        category,
        riskLevel,
        editable,
        updatedBy,
        changeReason
      }
    });
    await this.writeAuditLog({
      actor: setting.updatedBy,
      action: "setting.upserted",
      targetType: "OpsSetting",
      targetId: setting.id,
      summary: `${setting.key} 운영 설정 저장`,
      severity: setting.riskLevel === "critical" || setting.riskLevel === "high" ? "warning" : "info",
      beforeValue: previous?.value as Prisma.InputJsonValue | undefined,
      afterValue: setting.value as Prisma.InputJsonValue,
      metadata: { key: setting.key, category: setting.category, riskLevel: setting.riskLevel, changeReason }
    });

    return {
      id: setting.id,
      key: setting.key,
      value: JSON.stringify(setting.value),
      description: setting.description,
      category: setting.category,
      riskLevel: setting.riskLevel,
      editable: setting.editable,
      updatedBy: setting.updatedBy,
      changeReason: setting.changeReason,
      updatedAt: setting.updatedAt
    };
  }

  async analyzeLogs(input: AnalyzeLogsInputModel): Promise<AnalyzeLogsPayloadType> {
    if (!input.rawLogs?.trim()) {
      throw new BadRequestException("rawLogs가 비어 있습니다.");
    }

    const parsed = parseLogLines(input.rawLogs);
    const clusters = clusterLogs(parsed);
    const clusterTotalCount = clusters.length;
    const clusterLimit = Math.min(Math.max(input.clusterLimit ?? 12, 1), 50);
    const requestedBy = input.requestedBy?.trim() || "unknown";
    if (requestedBy.toLowerCase().startsWith("viewer")) {
      throw new BadRequestException("viewer 권한에서는 로그 분석을 실행할 수 없습니다.");
    }

    const source = this.toLogSource(input.source);
    const environment = this.toEnvironment(input.environment);
    if (!environment) {
      throw new BadRequestException("environment 값이 필요합니다.");
    }

    this.logger.log(
      `[audit] analyzeLogs requestedBy=${requestedBy} environment=${environment} service=${input.serviceName} source=${source} parsedLines=${parsed.length} clusterLimit=${clusterLimit}`
    );

    let deploymentId: string | undefined;
    if (input.deploymentVersion?.trim()) {
      const deployment = await this.prisma.deployment.upsert({
        where: {
          version_environment: {
            version: input.deploymentVersion.trim(),
            environment
          }
        },
        update: {},
        create: {
          version: input.deploymentVersion.trim(),
          environment,
          changelog: "로그 분석 중 자동 연결"
        }
      });
      deploymentId = deployment.id;
    }

    let createdIssues = 0;
    let updatedIssues = 0;

    for (const cluster of clusters) {
      const signature = `${environment}:${input.serviceName}:${cluster.normalizedMessage}`;

      const issueData: Prisma.IssueUncheckedCreateInput = {
        title: cluster.title,
        signature,
        severity: cluster.severity as IssueSeverity,
        status: "new",
        summary: `${cluster.affectedArea} 영역에서 '${cluster.title}' 유형의 오류가 ${cluster.count}회 감지되었습니다.`,
        probableCauses: cluster.probableCauses,
        suggestedActions: cluster.suggestedActions,
        reproductionGuide: cluster.reproductionGuide,
        serviceName: input.serviceName,
        environment,
        occurrenceCount: cluster.count,
        firstOccurredAt: cluster.firstSeen,
        lastOccurredAt: cluster.lastSeen,
        affectedArea: cluster.affectedArea,
        deploymentCorrelation: cluster.deploymentCorrelation,
        deploymentId,
        priority: cluster.severity === IssueSeverity.critical ? "P0" : cluster.severity === IssueSeverity.high ? "P1" : "P2",
        slaDueAt:
          cluster.severity === IssueSeverity.critical
            ? new Date(cluster.lastSeen.getTime() + 60 * 60 * 1000)
            : cluster.severity === IssueSeverity.high
              ? new Date(cluster.lastSeen.getTime() + 4 * 60 * 60 * 1000)
              : null,
        escalationLevel: cluster.severity === IssueSeverity.critical ? 2 : cluster.severity === IssueSeverity.high ? 1 : 0
      };

      const existing = await this.prisma.issue.findUnique({ where: { signature } });

      const issue = existing
        ? await this.prisma.issue.update({
            where: { id: existing.id },
            data: {
              severity: cluster.severity as IssueSeverity,
              summary: issueData.summary,
              probableCauses: issueData.probableCauses,
              suggestedActions: issueData.suggestedActions,
              reproductionGuide: issueData.reproductionGuide,
              occurrenceCount: { increment: cluster.count },
              firstOccurredAt:
                existing.firstOccurredAt < cluster.firstSeen ? existing.firstOccurredAt : cluster.firstSeen,
              lastOccurredAt:
                existing.lastOccurredAt > cluster.lastSeen ? existing.lastOccurredAt : cluster.lastSeen,
              affectedArea: cluster.affectedArea,
              deploymentCorrelation: cluster.deploymentCorrelation,
              deploymentId: deploymentId ?? existing.deploymentId,
              priority: issueData.priority,
              slaDueAt: issueData.slaDueAt,
              escalationLevel: issueData.escalationLevel
            }
          })
        : await this.prisma.issue.create({ data: issueData });

      if (existing) {
        updatedIssues += 1;
      } else {
        createdIssues += 1;
      }

      const logRows = cluster.lines.slice(0, 200).map((line) => ({
        issueId: issue.id,
        rawMessage: line.rawMessage,
        normalizedMessage: line.normalizedMessage,
        source,
        level: line.level,
        occurredAt: line.occurredAt,
        endpoint: line.endpoint,
        page: line.page
      }));

      if (logRows.length > 0) {
        await this.prisma.logEvent.createMany({ data: logRows });
      }
    }

    const displayedClusters = clusters.slice(0, clusterLimit);

    this.logger.log(
      `[audit] analyzeLogs completed requestedBy=${requestedBy} createdIssues=${createdIssues} updatedIssues=${updatedIssues} clusterTotalCount=${clusterTotalCount} clusterDisplayedCount=${displayedClusters.length}`
    );

    await this.prisma.logAnalysisSession.create({
      data: {
        environment,
        serviceName: input.serviceName,
        source,
        requestedBy,
        deploymentVersion: input.deploymentVersion?.trim() || null,
        rawLineCount: parsed.length,
        clusterTotalCount,
        clusterDisplayedCount: displayedClusters.length,
        createdIssues,
        updatedIssues,
        topClusterTitle: displayedClusters[0]?.title ?? null
      }
    });

    this.clearDerivedCaches();

    return {
      createdIssues,
      updatedIssues,
      clusterTotalCount,
      clusterDisplayedCount: displayedClusters.length,
      clusters: displayedClusters.map((cluster) => ({
        title: cluster.title,
        normalizedMessage: cluster.normalizedMessage,
        severity: cluster.severity,
        count: cluster.count,
        firstSeen: cluster.firstSeen,
        lastSeen: cluster.lastSeen,
        probableCauses: cluster.probableCauses,
        suggestedActions: cluster.suggestedActions,
        affectedArea: cluster.affectedArea,
        deploymentCorrelation: cluster.deploymentCorrelation,
        reproductionGuide: cluster.reproductionGuide
      }))
    };
  }

  async listRecentLogEvents(input?: {
    environment?: string;
    serviceName?: string;
    source?: string;
    take?: number;
  }): Promise<
    Array<{
      id: string;
      rawMessage: string;
      normalizedMessage: string;
      source: string;
      level: string;
      occurredAt: string;
      issueId: string;
    }>
  > {
    const take = Math.min(Math.max(input?.take ?? 20, 1), 100);
    const where: Prisma.LogEventWhereInput = {};

    const source = this.toLogSource(input?.source);
    if (input?.source) {
      where.source = source;
    }

    const issueWhere: Prisma.IssueWhereInput = {};
    const environment = this.toEnvironment(input?.environment);
    if (environment) {
      issueWhere.environment = environment;
    }
    if (input?.serviceName && input.serviceName !== "all") {
      issueWhere.serviceName = input.serviceName;
    }
    if (Object.keys(issueWhere).length > 0) {
      where.issue = issueWhere;
    }

    const rows = await this.prisma.logEvent.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take
    });

    return rows.map((row) => ({
      id: row.id,
      rawMessage: row.rawMessage,
      normalizedMessage: row.normalizedMessage,
      source: row.source,
      level: row.level,
      occurredAt: row.occurredAt.toISOString(),
      issueId: row.issueId
    }));
  }

  async listIssues(filter?: IssueFilterInput): Promise<IssueListPayloadType> {
    const pageSizeForCache = Math.min(Math.max(filter?.pageSize ?? 20, 1), 100);
    const shouldUseCache = pageSizeForCache <= 10;
    const cacheKey = shouldUseCache ? this.getIssueListCacheKey(filter) : null;
    if (cacheKey) {
      const cached = this.readIssueListCache(cacheKey);
      if (cached) {
        this.cacheStats.issueListHit += 1;
        this.logCacheStats();
        return cached;
      }
      this.cacheStats.issueListMiss += 1;
      this.logCacheStats();
    }

    const where = this.buildIssueWhere(filter);
    const page = Math.max(filter?.page ?? 1, 1);
    const pageSize = pageSizeForCache;

    const [totalCount, items] = await this.prisma.$transaction([
      this.prisma.issue.count({ where }),
      this.prisma.issue.findMany({
        where,
        include: { deployment: true },
        orderBy: [{ occurrenceCount: "desc" }, { lastOccurredAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    const payload: IssueListPayloadType = {
      items: items.map((issue) => this.toIssueType({ ...issue, logs: [], comments: [] })),
      totalCount,
      page,
      pageSize
    };
    if (cacheKey) this.writeIssueListCache(cacheKey, payload);
    return payload;
  }

  async getIssueDetail(issueId: string): Promise<IssueType> {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        deployment: true,
        comments: { orderBy: { createdAt: "desc" } },
        logs: { orderBy: { occurredAt: "desc" }, take: 30 }
      }
    });

    if (!issue) {
      throw new NotFoundException("이슈를 찾을 수 없습니다.");
    }

    return this.toIssueType(issue);
  }

  async updateIssueStatus(input: UpdateIssueStatusInput): Promise<IssueType> {
    const status = this.toStatus(input.status);
    if (!status) {
      throw new BadRequestException("status 값이 필요합니다.");
    }

    const updated = await this.prisma.issue.update({
      where: { id: input.issueId },
      data: { status },
      include: { deployment: true }
    });

    this.clearDerivedCaches();
    await this.writeAuditLog({
      action: "issue.status_updated",
      targetType: "Issue",
      targetId: updated.id,
      summary: `${updated.title} 상태를 ${updated.status}(으)로 변경`,
      metadata: { status: updated.status }
    });

    return this.toIssueType({ ...updated, logs: [], comments: [] });
  }

  async assignIssue(input: AssignIssueInput): Promise<IssueType> {
    const updated = await this.prisma.issue.update({
      where: { id: input.issueId },
      data: { assignee: input.assignee.trim() || null },
      include: { deployment: true }
    });

    this.clearDerivedCaches();
    await this.writeAuditLog({
      actor: input.assignee,
      action: "issue.assigned",
      targetType: "Issue",
      targetId: updated.id,
      summary: `${updated.title} 담당자 지정`,
      metadata: { assignee: updated.assignee }
    });

    return this.toIssueType({ ...updated, logs: [], comments: [] });
  }

  async addIssueComment(input: AddIssueCommentInput): Promise<IssueType> {
    const comment = await this.prisma.issueComment.create({
      data: {
        issueId: input.issueId,
        author: input.author.trim() || "익명",
        body: input.body
      }
    });
    await this.writeAuditLog({
      actor: comment.author,
      action: "issue.comment_added",
      targetType: "Issue",
      targetId: input.issueId,
      summary: "이슈 코멘트 추가",
      metadata: { commentId: comment.id }
    });

    return this.getIssueDetail(input.issueId);
  }

  async registerDeployment(input: RegisterDeploymentInput): Promise<DeploymentType> {
    const environment = this.toEnvironment(input.environment);
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
      scopeTags: this.normalizeStringList(input.scopeTags) as Prisma.JsonArray,
      checklist: this.normalizeStringList(input.checklist) as Prisma.JsonArray,
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

    this.clearDerivedCaches();
    await this.writeAuditLog({
      actor: deployment.owner,
      action: "deployment.registered",
      targetType: "Deployment",
      targetId: deployment.id,
      summary: `${deployment.version} 배포 등록/갱신`,
      metadata: { environment: deployment.environment, status: deployment.status }
    });

    return this.toDeploymentType(deployment);
  }

  async listDeployments(environment?: string): Promise<DeploymentType[]> {
    const envFilter = this.toEnvironment(environment);
    const deployments = await this.prisma.deployment.findMany({
      where: envFilter ? { environment: envFilter } : undefined,
      orderBy: { deployedAt: "desc" },
      take: 30
    });
    return deployments.map((deployment) => this.toDeploymentType(deployment));
  }

  async deploymentImpact(input: DeploymentImpactInput): Promise<DeploymentImpactReportType> {
    const cacheKey = this.getDeploymentImpactCacheKey(input);
    const cached = this.readDeploymentImpactCache(cacheKey);
    if (cached) {
      this.cacheStats.deploymentImpactHit += 1;
      this.logCacheStats();
      return cached;
    }
    this.cacheStats.deploymentImpactMiss += 1;
    this.logCacheStats();

    const environment = this.toEnvironment(input.environment);
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
    const riskLevel = this.getDeploymentRiskLevel({ increasedIssues, totalAfterErrorCount });
    const recommendedAction = this.getDeploymentRecommendedAction(riskLevel);
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

  async generateQaScenario(input: QaAssistantInputModel): Promise<QaScenarioType> {
    const fallback = {
      generatedCases: [
        `${input.featureName} 정상 시나리오`,
        `${input.featureName} 경계값 시나리오`,
        `${input.featureName} 오류 응답/지연 시나리오`,
        `${input.featureName} 모바일 반응형 시나리오`
      ],
      riskPoints: [
        "API 응답 필드 누락 시 UI 깨짐 여부",
        "권한/세션 만료 상황에서의 동작",
        "배포 후 기존 기능 회귀 가능성"
      ],
      regressionTargets: [
        "관련 화면의 기존 주요 플로우",
        "연관 API 에러 핸들링",
        "공통 컴포넌트 스타일/상태 동기화"
      ]
    };

    const generated = await this.aiService.generateJson<typeof fallback>(
      [
        "당신은 QA 시나리오 생성 도우미입니다.",
        "아래 입력을 바탕으로 JSON만 출력하세요.",
        '{"generatedCases": string[], "riskPoints": string[], "regressionTargets": string[]}',
        `기능: ${input.featureName}`,
        `변경 화면: ${input.changedScreens}`,
        `관련 API: ${input.relatedApis}`,
        `배포 노트: ${input.releaseNote}`,
        `대상 독자: ${input.audience}`
      ].join("\n"),
      fallback
    );

    const created = await this.prisma.qaScenario.create({
      data: {
        featureName: input.featureName,
        changedScreens: input.changedScreens,
        relatedApis: input.relatedApis,
        releaseNote: input.releaseNote,
        generatedCases: generated.generatedCases,
        riskPoints: generated.riskPoints,
        regressionTargets: generated.regressionTargets,
        audience: input.audience,
        status: "draft",
        owner: input.owner?.trim() || "QA 담당자",
        reviewer: input.reviewer?.trim() || null,
        executionStatus: "not_started"
      }
    });

    this.qaScenarioListCache.clear();

    return this.toQaScenarioType(created);
  }

  async recentQaScenarios(): Promise<QaScenarioType[]> {
    const cached = this.readQaScenarioListCache();
    if (cached) {
      this.cacheStats.qaScenarioHit += 1;
      this.logCacheStats();
      return cached;
    }
    this.cacheStats.qaScenarioMiss += 1;
    this.logCacheStats();

    const scenarios = await this.prisma.qaScenario.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const mapped = scenarios.map((scenario) => this.toQaScenarioType(scenario));
    this.writeQaScenarioListCache(mapped);
    return mapped;
  }

  async deleteQaScenario(scenarioId: string): Promise<boolean> {
    const existing = await this.prisma.qaScenario.findUnique({
      where: { id: scenarioId },
      select: { id: true }
    });

    if (!existing) {
      throw new NotFoundException("QA 시나리오를 찾을 수 없습니다.");
    }

    await this.prisma.qaScenario.delete({
      where: { id: scenarioId }
    });
    await this.writeAuditLog({
      action: "qa_scenario.deleted",
      targetType: "QaScenario",
      targetId: scenarioId,
      summary: "QA 산출물 삭제"
    });

    this.qaScenarioListCache.clear();
    return true;
  }

  async aiBriefing(filter?: DashboardFilterInput): Promise<string> {
    const summary = await this.getDashboardSummary(filter);
    return summary.aiBriefing;
  }
}
