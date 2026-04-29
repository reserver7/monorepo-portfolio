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
  private readonly logger = new Logger(OpsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

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
    this.dashboardBriefingCache.set(key, { value, expiresAt: Date.now() + 90_000 });
    if (this.dashboardBriefingCache.size > 200) {
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

  async getDashboardSummary(filter?: DashboardFilterInput): Promise<DashboardSummaryType> {
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

    return {
      todayIssueCount,
      severityDistribution,
      errorTrend24h,
      topRepeatedErrors,
      newAfterLatestDeployment,
      aiBriefing
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

  async listIssues(filter?: IssueFilterInput): Promise<IssueListPayloadType> {
    const where = this.buildIssueWhere(filter);
    const page = Math.max(filter?.page ?? 1, 1);
    const pageSize = Math.min(Math.max(filter?.pageSize ?? 20, 1), 100);

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

    return {
      items: items.map((issue) => this.toIssueType({ ...issue, logs: [], comments: [] })),
      totalCount,
      page,
      pageSize
    };
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

    return this.toIssueType({ ...updated, logs: [], comments: [] });
  }

  async assignIssue(input: AssignIssueInput): Promise<IssueType> {
    const updated = await this.prisma.issue.update({
      where: { id: input.issueId },
      data: { assignee: input.assignee.trim() || null },
      include: { deployment: true }
    });

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

    const increasedIssues: DeploymentImpactReportType["increasedIssues"] = [];
    let totalAfterErrorCount = 0;

    for (const issue of candidateIssues) {
      const [beforeCount, afterCount] = await this.prisma.$transaction([
        this.prisma.logEvent.count({
          where: {
            issueId: issue.id,
            occurredAt: { gte: beforeStart, lt: deployment.deployedAt }
          }
        }),
        this.prisma.logEvent.count({
          where: {
            issueId: issue.id,
            occurredAt: { gte: deployment.deployedAt, lte: afterEnd }
          }
        })
      ]);

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

    return {
      version: deployment.version,
      environment: deployment.environment,
      deployedAt: deployment.deployedAt,
      increasedIssueCount: increasedIssues.length,
      totalAfterErrorCount,
      increasedIssues: increasedIssues.slice(0, 10),
      summary
    };
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
    const scenarios = await this.prisma.qaScenario.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return scenarios.map((scenario) => ({
      id: scenario.id,
      featureName: scenario.featureName,
      generatedCases: this.parseArray(scenario.generatedCases),
      riskPoints: this.parseArray(scenario.riskPoints),
      regressionTargets: this.parseArray(scenario.regressionTargets),
      audience: scenario.audience,
      createdAt: scenario.createdAt
    }));
  }

  async aiBriefing(filter?: DashboardFilterInput): Promise<string> {
    const summary = await this.getDashboardSummary(filter);
    return summary.aiBriefing;
  }
}
