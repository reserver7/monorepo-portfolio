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
  type LogEvent
} from "@prisma/client";
import { env } from "../../config/env.js";
import { PrismaService } from "../../integration/db/prisma.service.js";
import { AiService } from "../ai/ai.service.js";
import {
  type AddIssueCommentInput,
  type AnalyzeLogsInputModel,
  type AssignIssueInput,
  type DashboardFilterInput,
  type DeploymentImpactInput,
  type IssueFilterInput,
  type QaAssistantInputModel,
  type RegisterDeploymentInput,
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
        deploymentId
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
              deploymentId: deploymentId ?? existing.deploymentId
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

    return this.toIssueType({ ...updated, logs: [], comments: [] });
  }

  async assignIssue(input: AssignIssueInput): Promise<IssueType> {
    const updated = await this.prisma.issue.update({
      where: { id: input.issueId },
      data: { assignee: input.assignee.trim() || null },
      include: { deployment: true }
    });

    this.clearDerivedCaches();

    return this.toIssueType({ ...updated, logs: [], comments: [] });
  }

  async addIssueComment(input: AddIssueCommentInput): Promise<IssueType> {
    await this.prisma.issueComment.create({
      data: {
        issueId: input.issueId,
        author: input.author.trim() || "익명",
        body: input.body
      }
    });

    return this.getIssueDetail(input.issueId);
  }

  async registerDeployment(input: RegisterDeploymentInput): Promise<DeploymentType> {
    const environment = this.toEnvironment(input.environment);
    if (!environment) {
      throw new BadRequestException("environment 값이 필요합니다.");
    }

    const deployedAt = input.deployedAt ? new Date(input.deployedAt) : new Date();

    const deployment = await this.prisma.deployment.upsert({
      where: {
        version_environment: {
          version: input.version,
          environment
        }
      },
      update: {
        changelog: input.changelog,
        deployedAt
      },
      create: {
        version: input.version,
        environment,
        changelog: input.changelog,
        deployedAt
      }
    });

    this.clearDerivedCaches();

    return deployment;
  }

  async listDeployments(environment?: string): Promise<DeploymentType[]> {
    const envFilter = this.toEnvironment(environment);
    return this.prisma.deployment.findMany({
      where: envFilter ? { environment: envFilter } : undefined,
      orderBy: { deployedAt: "desc" },
      take: 30
    });
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

    const beforeStart = new Date(deployment.deployedAt.getTime() - 24 * 60 * 60 * 1000);
    const afterEnd = new Date(deployment.deployedAt.getTime() + 24 * 60 * 60 * 1000);

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
    const summary = !topIncreasedIssue
      ? "배포 전후 24시간 비교에서 유의미한 증가 이슈가 발견되지 않았습니다."
      : `배포 이후 증가 이슈 ${increasedIssues.length}건이 감지되었고, 가장 큰 증가 이슈는 '${topIncreasedIssue.title}' 입니다.`;

    const report: DeploymentImpactReportType = {
      version: deployment.version,
      environment: deployment.environment,
      deployedAt: deployment.deployedAt,
      increasedIssueCount: increasedIssues.length,
      totalAfterErrorCount,
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
        audience: input.audience
      }
    });

    this.qaScenarioListCache.clear();

    return {
      id: created.id,
      featureName: created.featureName,
      generatedCases: this.parseArray(created.generatedCases),
      riskPoints: this.parseArray(created.riskPoints),
      regressionTargets: this.parseArray(created.regressionTargets),
      audience: created.audience,
      createdAt: created.createdAt
    };
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

    const mapped = scenarios.map((scenario) => ({
      id: scenario.id,
      featureName: scenario.featureName,
      generatedCases: this.parseArray(scenario.generatedCases),
      riskPoints: this.parseArray(scenario.riskPoints),
      regressionTargets: this.parseArray(scenario.regressionTargets),
      audience: scenario.audience,
      createdAt: scenario.createdAt
    }));
    this.writeQaScenarioListCache(mapped);
    return mapped;
  }

  async aiBriefing(filter?: DashboardFilterInput): Promise<string> {
    const summary = await this.getDashboardSummary(filter);
    return summary.aiBriefing;
  }
}
