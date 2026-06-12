import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { IssueSeverity, Prisma } from "@prisma/client";

import { PrismaService } from "../../integration/db/prisma.service.js";
import type { AnalyzeLogsInputModel } from "./ops.inputs.js";
import { clusterLogs, parseLogLines } from "./log-parser.js";
import { toEnvironment, toLogSource } from "./ops.filters.js";
import type { AnalyzeLogsPayloadType, LogAnalysisSessionType } from "./ops.types.js";

@Injectable()
export class OpsLogAnalysisService {
  private readonly logger = new Logger(OpsLogAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    const source = toLogSource(input.source);
    const environment = toEnvironment(input.environment);
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

    const source = toLogSource(input?.source);
    if (input?.source) {
      where.source = source;
    }

    const issueWhere: Prisma.IssueWhereInput = {};
    const environment = toEnvironment(input?.environment);
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
}
