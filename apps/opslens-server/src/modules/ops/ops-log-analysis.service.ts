import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { IssueSeverity, Prisma } from "@prisma/client";

import { PrismaService } from "../../integration/db/prisma.service.js";
import type { AnalyzeLogsInputModel, UpsertLogSavedViewInput } from "./ops.inputs.js";
import { clusterLogs, parseLogLines } from "./log-parser.js";
import { toEnvironment, toLogSource } from "./ops.filters.js";
import { writeOpsAuditLog } from "./ops-audit-writer.js";
import type { AnalyzeLogsPayloadType, LogAnalysisSessionType } from "./ops.types.js";

@Injectable()
export class OpsLogAnalysisService {
  private readonly logger = new Logger(OpsLogAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listSavedViews(actor?: string) {
    return this.prisma.opsLogSavedView.findMany({ where: actor ? { OR: [{ visibility: "team" }, { owner: actor }] } : { visibility: "team" }, orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }], take: 30 });
  }

  async getLogSourceFreshness(): Promise<Array<{ serviceName: string; source: string; lastReceivedAt: Date | null; receivedLastHour: number; stale: boolean }>> {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
    const rows = await this.prisma.$queryRaw<Array<{ serviceName: string; source: string; lastReceivedAt: Date | null; receivedLastHour: number }>>(Prisma.sql`
      SELECT issue."serviceName" AS "serviceName", event."source"::text AS "source", MAX(event."occurredAt") AS "lastReceivedAt",
        COUNT(*) FILTER (WHERE event."occurredAt" >= ${hourAgo})::int AS "receivedLastHour"
      FROM "LogEvent" event INNER JOIN "Issue" issue ON issue.id = event."issueId"
      WHERE event."occurredAt" >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
      GROUP BY issue."serviceName", event."source" ORDER BY issue."serviceName", event."source"
    `);
    return rows.map((row) => ({ ...row, receivedLastHour: Number(row.receivedLastHour), stale: !row.lastReceivedAt || row.lastReceivedAt < staleBefore }));
  }

  async upsertSavedView(input: UpsertLogSavedViewInput, actor?: string) {
    const owner = actor ?? "unknown";
    if (!input.name.trim()) throw new BadRequestException("뷰 이름이 필요합니다.");
    const view = input.id
      ? await this.prisma.opsLogSavedView.update({ where: { id: input.id, owner }, data: { name: input.name.trim(), severity: input.severity, query: input.query, sort: input.sort, visibility: input.visibility === "private" ? "private" : "team", isFavorite: Boolean(input.isFavorite) } })
      : await this.prisma.opsLogSavedView.create({ data: { name: input.name.trim(), owner, severity: input.severity, query: input.query, sort: input.sort, visibility: input.visibility === "private" ? "private" : "team", isFavorite: Boolean(input.isFavorite) } });
    await writeOpsAuditLog(this.prisma, this.logger, { actor, action: input.id ? "log_saved_view.updated" : "log_saved_view.created", targetType: "OpsLogSavedView", targetId: view.id, summary: `${view.name} 로그 뷰 ${input.id ? "수정" : "생성"}`, metadata: { visibility: view.visibility, severity: view.severity, sort: view.sort } });
    return view;
  }

  async deleteSavedView(id: string, actor?: string): Promise<boolean> {
    const view = await this.prisma.opsLogSavedView.findFirst({ where: { id, owner: actor ?? "unknown" } });
    if (!view) return false;
    const result = await this.prisma.opsLogSavedView.deleteMany({ where: { id, owner: actor ?? "unknown" } });
    await writeOpsAuditLog(this.prisma, this.logger, { actor, action: "log_saved_view.deleted", targetType: "OpsLogSavedView", targetId: id, summary: `${view.name} 로그 뷰 삭제`, metadata: { visibility: view.visibility } });
    return result.count > 0;
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
    const issueIdBySignature = new Map<string, string>();

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
      issueIdBySignature.set(signature, issue.id);

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
        issueId: issueIdBySignature.get(`${environment}:${input.serviceName}:${cluster.normalizedMessage}`)!,
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
