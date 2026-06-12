import { Injectable } from "@nestjs/common";
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
import { OpsAlertService } from "./ops-alert.service.js";
import { OpsDashboardService } from "./ops-dashboard.service.js";
import { OpsDeploymentService } from "./ops-deployment.service.js";
import { OpsIssueService } from "./ops-issue.service.js";
import { OpsLogAnalysisService } from "./ops-log-analysis.service.js";
import { OpsQaService } from "./ops-qa.service.js";
import { OpsReportService } from "./ops-report.service.js";
import { OpsSettingsService } from "./ops-settings.service.js";
import type {
  AnalyzeLogsPayloadType,
  DashboardSummaryType,
  DeploymentImpactReportType,
  DeploymentType,
  IssueListPayloadType,
  IssueSummaryType,
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
  constructor(
    private readonly dashboardService: OpsDashboardService,
    private readonly deploymentService: OpsDeploymentService,
    private readonly issueService: OpsIssueService,
    private readonly logAnalysisService: OpsLogAnalysisService,
    private readonly alertService: OpsAlertService,
    private readonly qaService: OpsQaService,
    private readonly reportService: OpsReportService,
    private readonly settingsService: OpsSettingsService
  ) {}

  private clearDerivedCaches(): void {
    this.dashboardService.clearCache();
    this.deploymentService.clearCache();
    this.issueService.clearCache();
    this.qaService.clearCache();
  }

  async getDashboardSummary(filter?: DashboardFilterInput): Promise<DashboardSummaryType> {
    return this.dashboardService.getDashboardSummary(filter);
  }

  async getOpsReport(filter?: DashboardFilterInput): Promise<OpsReportType> {
    return this.reportService.getOpsReport(filter);
  }

  async listReportSnapshots(): Promise<OpsReportSnapshotType[]> {
    return this.reportService.listReportSnapshots();
  }

  async updateReportSnapshot(input: UpdateReportSnapshotInput): Promise<OpsReportSnapshotType> {
    return this.reportService.updateReportSnapshot(input);
  }

  async deleteReportSnapshot(snapshotId: string, actor?: string): Promise<boolean> {
    return this.reportService.deleteReportSnapshot(snapshotId, actor);
  }

  async listOpsAlerts(): Promise<OpsAlertType[]> {
    return this.alertService.listOpsAlerts();
  }

  async createOpsAlert(input: CreateOpsAlertInput): Promise<OpsAlertType> {
    return this.alertService.createOpsAlert(input);
  }

  async markOpsAlertRead(alertId: string): Promise<OpsAlertType> {
    return this.alertService.markOpsAlertRead(alertId);
  }

  async markAllOpsAlertsRead(): Promise<boolean> {
    return this.alertService.markAllOpsAlertsRead();
  }

  async deleteOpsAlert(alertId: string): Promise<boolean> {
    return this.alertService.deleteOpsAlert(alertId);
  }

  async listLogAnalysisSessions(): Promise<LogAnalysisSessionType[]> {
    return this.logAnalysisService.listLogAnalysisSessions();
  }

  async listOpsSettings(): Promise<OpsSettingType[]> {
    return this.settingsService.listOpsSettings();
  }

  async listOpsAuditLogs(filter?: OpsAuditLogFilterInput): Promise<OpsAuditLogType[]> {
    return this.settingsService.listOpsAuditLogs(filter);
  }

  async upsertOpsSetting(input: UpsertOpsSettingInput): Promise<OpsSettingType> {
    return this.settingsService.upsertOpsSetting(input);
  }

  async analyzeLogs(input: AnalyzeLogsInputModel): Promise<AnalyzeLogsPayloadType> {
    const result = await this.logAnalysisService.analyzeLogs(input);
    this.clearDerivedCaches();
    return result;
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
    return this.logAnalysisService.listRecentLogEvents(input);
  }

  async listIssues(filter?: IssueFilterInput): Promise<IssueListPayloadType> {
    return this.issueService.listIssues(filter);
  }

  async getIssueSummary(filter?: IssueFilterInput): Promise<IssueSummaryType> {
    return this.issueService.getIssueSummary(filter);
  }

  async getIssueDetail(issueId: string): Promise<IssueType> {
    return this.issueService.getIssueDetail(issueId);
  }

  async updateIssueStatus(input: UpdateIssueStatusInput): Promise<IssueType> {
    this.clearDerivedCaches();
    return this.issueService.updateIssueStatus(input);
  }

  async assignIssue(input: AssignIssueInput): Promise<IssueType> {
    this.clearDerivedCaches();
    return this.issueService.assignIssue(input);
  }

  async addIssueComment(input: AddIssueCommentInput): Promise<IssueType> {
    return this.issueService.addIssueComment(input);
  }

  async registerDeployment(input: RegisterDeploymentInput): Promise<DeploymentType> {
    this.clearDerivedCaches();
    return this.deploymentService.registerDeployment(input);
  }

  async listDeployments(environment?: string): Promise<DeploymentType[]> {
    return this.deploymentService.listDeployments(environment);
  }

  async deploymentImpact(input: DeploymentImpactInput): Promise<DeploymentImpactReportType> {
    return this.deploymentService.deploymentImpact(input);
  }

  async generateQaScenario(input: QaAssistantInputModel): Promise<QaScenarioType> {
    return this.qaService.generateQaScenario(input);
  }

  async recentQaScenarios(): Promise<QaScenarioType[]> {
    return this.qaService.recentQaScenarios();
  }

  async deleteQaScenario(scenarioId: string): Promise<boolean> {
    return this.qaService.deleteQaScenario(scenarioId);
  }

  async aiBriefing(filter?: DashboardFilterInput): Promise<string> {
    const summary = await this.getDashboardSummary(filter);
    return summary.aiBriefing;
  }
}
