import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { IssueSeverity, Prisma } from "@prisma/client";

import { PrismaService } from "../../integration/db/prisma.service.js";
import type { DashboardFilterInput, UpdateReportActionInput, UpdateReportSnapshotInput } from "./ops.inputs.js";
import { writeOpsAuditLog } from "./ops-audit-writer.js";
import { buildIssueWhere, toEnvironment } from "./ops.filters.js";
import { OpsDashboardService } from "./ops-dashboard.service.js";
import type { OpsReportActionType, OpsReportSnapshotType, OpsReportType } from "./ops.types.js";

@Injectable()
export class OpsReportService implements OnModuleInit {
  private readonly logger = new Logger(OpsReportService.name);
  private scheduleRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardService: OpsDashboardService
  ) {}

  onModuleInit(): void {
    const timer = setInterval(() => void this.runScheduledReport().catch((error) => this.logger.warn(`예약 리포트 생성 오류: ${error instanceof Error ? error.message : String(error)}`)), 60 * 60_000);
    timer.unref();
    void this.runScheduledReport().catch((error) => this.logger.warn(`예약 리포트 초기 점검 오류: ${error instanceof Error ? error.message : String(error)}`));
  }

  private async runScheduledReport(): Promise<void> {
    if (this.scheduleRunning) return;
    const setting = await this.prisma.opsSetting.findUnique({ where: { key: "report.schedule" }, select: { value: true } });
    const schedule = setting?.value as { enabled?: unknown; weekday?: unknown; hour?: unknown } | undefined;
    if (schedule?.enabled !== true) return;
    const weekday = typeof schedule.weekday === "number" ? Math.min(6, Math.max(0, schedule.weekday)) : 1;
    const hour = typeof schedule.hour === "number" ? Math.min(23, Math.max(0, schedule.hour)) : 9;
    const now = new Date();
    if (now.getUTCDay() !== weekday || now.getUTCHours() < hour) return;
    const runKey = now.toISOString().slice(0, 10);
    const lastRun = await this.prisma.opsSetting.findUnique({ where: { key: "report.schedule.last_run" }, select: { value: true } });
    if ((lastRun?.value as { date?: string } | null)?.date === runKey) return;
    this.scheduleRunning = true;
    try {
      await this.getOpsReport();
      await this.prisma.opsSetting.upsert({ where: { key: "report.schedule.last_run" }, update: { value: { date: runKey, generatedAt: now.toISOString() }, updatedBy: "system" }, create: { key: "report.schedule.last_run", value: { date: runKey, generatedAt: now.toISOString() }, description: "예약 리포트 마지막 생성 시각", category: "report", riskLevel: "low", editable: false, updatedBy: "system" } });
      this.logger.log(`예약 운영 리포트 생성 완료: ${runKey}`);
    } finally {
      this.scheduleRunning = false;
    }
  }

  async getOpsReport(filter?: DashboardFilterInput): Promise<OpsReportType> {
    const summary = await this.dashboardService.getDashboardSummary(filter);
    const issues = await this.prisma.issue.findMany({
      where: buildIssueWhere(filter),
      orderBy: [{ severity: "asc" }, { occurrenceCount: "desc" }, { lastOccurredAt: "desc" }],
      take: 5
    });
    const criticalCount = summary.severityDistribution.find((item) => item.severity === "critical")?.count ?? 0;
    const highCount = summary.severityDistribution.find((item) => item.severity === "high")?.count ?? 0;
    const now = new Date();
    const openIssueWhere: Prisma.IssueWhereInput = {
      ...buildIssueWhere(filter),
      status: { not: "resolved" }
    };
    const [slaRiskCount, unassignedCount] = await Promise.all([
      this.prisma.issue.count({ where: { ...openIssueWhere, slaDueAt: { lt: now } } }),
      this.prisma.issue.count({ where: { ...openIssueWhere, OR: [{ assignee: null }, { assignee: "" }] } })
    ]);
    const resolvedForMetrics = await this.prisma.issue.findMany({
      where: { ...buildIssueWhere(filter), resolvedAt: { not: null } },
      select: { firstOccurredAt: true, acknowledgedAt: true, resolvedAt: true },
      take: 100,
      orderBy: { resolvedAt: "desc" }
    });
    const averageMinutes = (durations: number[]): string => {
      if (durations.length === 0) return "-";
      return `${Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)}분`;
    };
    const mtta = averageMinutes(resolvedForMetrics.filter((item) => item.acknowledgedAt).map((item) => (item.acknowledgedAt!.getTime() - item.firstOccurredAt.getTime()) / 60_000));
    const mttr = averageMinutes(resolvedForMetrics.map((item) => (item.resolvedAt!.getTime() - item.firstOccurredAt.getTime()) / 60_000));
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
      slaRiskCount > 0 || unassignedCount > 0
        ? `SLA 위험 ${slaRiskCount}건, 담당자 미지정 ${unassignedCount}건을 우선 정리해야 합니다.`
        : "SLA 위험 및 담당자 미지정 이슈는 없습니다.",
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
      ...(slaRiskCount > 0 || unassignedCount > 0
        ? [{
            title: "SLA 및 소유권 정리",
            description: `SLA 위험 ${slaRiskCount}건과 담당자 미지정 ${unassignedCount}건을 확인합니다.`,
            owner: "운영 리드",
            priority: slaRiskCount > 0 ? "P1" : "P2"
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
      `- SLA 위험 / 미지정: ${slaRiskCount} / ${unassignedCount}`,
      `- MTTA / MTTR: ${mtta} / ${mttr}`,
      "",
      "[Action]",
      ...actionItems.map((item) => `- ${item.priority} ${item.title}: ${item.owner}`)
    ].join("\n");

    const report: OpsReportType = {
      snapshotId: "",
      title,
      generatedAt,
      riskLevel,
      executiveSummary,
      technicalSummary,
      shareText,
      kpis: [
        { label: "오늘 이슈", value: String(summary.todayIssueCount), helper: "현재 필터 기준", tone: summary.todayIssueCount > 0 ? "warning" : "default" },
        { label: "Critical / High", value: `${criticalCount} / ${highCount}`, helper: "즉시 확인 대상", tone: criticalCount > 0 ? "danger" : highCount > 0 ? "warning" : "default" },
        {
          label: "배포 이후 증가",
          value: String(deployRiskCount),
          helper: "최근 배포 영향",
          tone: deployRiskCount > 0 ? "warning" : "default"
        },
        {
          label: "SLA 위험",
          value: String(slaRiskCount),
          helper: `담당자 미지정 ${unassignedCount}건`,
          tone: slaRiskCount > 0 ? "danger" : unassignedCount > 0 ? "warning" : "default"
        },
        {
          label: "MTTA / MTTR",
          value: `${mtta} / ${mttr}`,
          helper: `최근 해결 이슈 ${resolvedForMetrics.length}건 기준`,
          tone: "default"
        }
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
        environment: toEnvironment(filter?.environment),
        riskLevel,
        executiveSummary,
        technicalSummary,
        shareText,
        generatedBy: filter?.serviceName && filter.serviceName !== "all" ? filter.serviceName : "system",
        generatedAt: new Date(generatedAt)
      }
    });
    await this.prisma.opsReportAction.createMany({
      data: actionItems.map((item) => ({
        snapshotId: snapshot.id,
        actionKey: `${item.priority}:${item.title}`,
        title: item.title,
        description: item.description,
        owner: item.owner,
        priority: item.priority,
        dueAt: new Date(Date.now() + (item.priority === "P0" ? 24 : item.priority === "P1" ? 72 : 7 * 24) * 60 * 60 * 1000)
      }))
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      action: "report_snapshot.created",
      targetType: "OpsReportSnapshot",
      targetId: snapshot.id,
      summary: `${title} 리포트 스냅샷 생성`,
      metadata: { riskLevel, environment }
    });

    report.snapshotId = snapshot.id;
    return report;
  }

  async listReportActions(snapshotId: string): Promise<OpsReportActionType[]> {
    const actions = await this.prisma.opsReportAction.findMany({
      where: { snapshotId },
      orderBy: [{ completedAt: "asc" }, { priority: "asc" }, { createdAt: "asc" }]
    });
    return actions.map((action) => ({
      id: action.id,
      snapshotId: action.snapshotId,
      title: action.title,
      description: action.description,
      owner: action.owner,
      priority: action.priority,
      dueAt: action.dueAt,
      completedAt: action.completedAt,
      completedBy: action.completedBy,
      reopenedReason: action.reopenedReason
    }));
  }

  async updateReportAction(input: UpdateReportActionInput, actor?: string): Promise<OpsReportActionType> {
    const dueAt = input.dueAt?.trim() ? new Date(input.dueAt) : input.dueAt === undefined ? undefined : null;
    if (dueAt instanceof Date && Number.isNaN(dueAt.getTime())) throw new BadRequestException("기한이 올바르지 않습니다.");
    const action = await this.prisma.opsReportAction.update({
      where: { id: input.actionId },
      data: input.completed
        ? { completedAt: new Date(), completedBy: actor ?? input.actor ?? "unknown", reopenedReason: null, dueAt, owner: input.owner?.trim() || undefined }
        : { completedAt: null, completedBy: null, reopenedReason: input.reopenedReason?.trim() || null, dueAt, owner: input.owner?.trim() || undefined }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor: actor ?? input.actor,
      action: input.completed ? "report_action.completed" : "report_action.reopened",
      targetType: "OpsReportAction",
      targetId: action.id,
      summary: `${action.title} 액션 아이템 ${input.completed ? "완료" : "재개"}`,
      metadata: { snapshotId: action.snapshotId, completed: input.completed }
    });
    return {
      id: action.id,
      snapshotId: action.snapshotId,
      title: action.title,
      description: action.description,
      owner: action.owner,
      priority: action.priority,
      dueAt: action.dueAt,
      completedAt: action.completedAt,
      completedBy: action.completedBy,
      reopenedReason: action.reopenedReason
    };
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
    await writeOpsAuditLog(this.prisma, this.logger, {
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
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor,
      action: "report_snapshot.deleted",
      targetType: "OpsReportSnapshot",
      targetId: existing.id,
      summary: `${existing.title} 리포트 스냅샷 삭제`
    });
    return true;
  }
}
