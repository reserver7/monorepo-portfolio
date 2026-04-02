import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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
import { PrismaService } from "../../platform/db/prisma.service.js";
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

  async getDashboardSummary(filter?: DashboardFilterInput): Promise<DashboardSummaryType> {
    const issueWhere = this.buildIssueWhere(filter);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const todayIssueCount = await this.prisma.issue.count({
      where: {
        ...issueWhere,
        updatedAt: { gte: startOfDay }
      }
    });

    const severityRows = await this.prisma.issue.groupBy({
      by: ["severity"],
      where: issueWhere,
      _count: { severity: true }
    });

    const severityDistribution = ["critical", "high", "medium", "low"].map((severity) => ({
      severity,
      count: severityRows.find((row) => row.severity === severity)?._count.severity ?? 0
    }));

    const to = filter?.to ? new Date(filter.to) : now;
    const from = filter?.from ? new Date(filter.from) : new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const trendLogs = await this.prisma.logEvent.findMany({
      where: {
        occurredAt: { gte: from, lte: to },
        issue: issueWhere
      },
      select: { occurredAt: true }
    });

    const hourlyMap = new Map<string, number>();
    for (let i = 23; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const key = `${d.getHours().toString().padStart(2, "0")}:00`;
      hourlyMap.set(key, 0);
    }

    for (const log of trendLogs) {
      const key = `${log.occurredAt.getHours().toString().padStart(2, "0")}:00`;
      if (hourlyMap.has(key)) hourlyMap.set(key, (hourlyMap.get(key) ?? 0) + 1);
    }

    const errorTrend24h = Array.from(hourlyMap.entries()).map(([hour, count]) => ({ hour, count }));

    const topRepeatedIssues = await this.prisma.issue.findMany({
      where: issueWhere,
      orderBy: [{ occurrenceCount: "desc" }, { lastOccurredAt: "desc" }],
      take: 5
    });

    const topRepeatedErrors = topRepeatedIssues.map((issue) => ({
      issueId: issue.id,
      title: issue.title,
      severity: issue.severity,
      count: issue.occurrenceCount
    }));

    const deploymentWhere: Prisma.DeploymentWhereInput = {};
    const environment = this.toEnvironment(filter?.environment);
    if (environment) deploymentWhere.environment = environment;

    const latestDeployment = await this.prisma.deployment.findFirst({
      where: deploymentWhere,
      orderBy: { deployedAt: "desc" }
    });

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
      severity: issue.severity,
      count: issue.occurrenceCount
    }));

    const aiBriefing = await this.generateBriefingText({
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

    const source = this.toLogSource(input.source);
    const environment = this.toEnvironment(input.environment);
    if (!environment) {
      throw new BadRequestException("environment 값이 필요합니다.");
    }

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

    return {
      createdIssues,
      updatedIssues,
      clusters: clusters.map((cluster) => ({
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
