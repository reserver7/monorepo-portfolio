import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { OpsAuthGuard } from "../auth/auth.guard.js";
import {
  AddIssueCommentInput,
  AnalyzeLogsInputModel,
  AssignIssueInput,
  CreateOpsAlertInput,
  DashboardFilterInput,
  DeploymentImpactInput,
  IssueFilterInput,
  OpsAuditLogFilterInput,
  QaAssistantInputModel,
  RegisterDeploymentInput,
  UpsertOpsSettingInput,
  UpdateReportSnapshotInput,
  UpdateIssueStatusInput
} from "./ops.inputs.js";
import {
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
import { OpsService } from "./ops.service.js";

@Resolver()
@UseGuards(OpsAuthGuard)
export class OpsResolver {
  constructor(private readonly opsService: OpsService) {}

  @Query(() => DashboardSummaryType)
  dashboardSummary(
    @Args("filter", { type: () => DashboardFilterInput, nullable: true })
    filter?: DashboardFilterInput
  ): Promise<DashboardSummaryType> {
    return this.opsService.getDashboardSummary(filter);
  }

  @Query(() => IssueListPayloadType)
  issues(
    @Args("filter", { type: () => IssueFilterInput, nullable: true })
    filter?: IssueFilterInput
  ): Promise<IssueListPayloadType> {
    return this.opsService.listIssues(filter);
  }

  @Query(() => IssueSummaryType)
  issueSummary(
    @Args("filter", { type: () => IssueFilterInput, nullable: true })
    filter?: IssueFilterInput
  ): Promise<IssueSummaryType> {
    return this.opsService.getIssueSummary(filter);
  }

  @Query(() => IssueType)
  issueDetail(@Args("issueId", { type: () => String }) issueId: string): Promise<IssueType> {
    return this.opsService.getIssueDetail(issueId);
  }

  @Query(() => [DeploymentType])
  deployments(
    @Args("environment", { type: () => String, nullable: true })
    environment?: string
  ): Promise<DeploymentType[]> {
    return this.opsService.listDeployments(environment);
  }

  @Query(() => DeploymentImpactReportType)
  deploymentImpact(
    @Args("input", { type: () => DeploymentImpactInput })
    input: DeploymentImpactInput
  ): Promise<DeploymentImpactReportType> {
    return this.opsService.deploymentImpact(input);
  }

  @Query(() => String)
  aiBriefing(
    @Args("filter", { type: () => DashboardFilterInput, nullable: true })
    filter?: DashboardFilterInput
  ): Promise<string> {
    return this.opsService.aiBriefing(filter);
  }

  @Query(() => OpsReportType)
  opsReport(
    @Args("filter", { type: () => DashboardFilterInput, nullable: true })
    filter?: DashboardFilterInput
  ): Promise<OpsReportType> {
    return this.opsService.getOpsReport(filter);
  }

  @Query(() => [OpsReportSnapshotType])
  reportSnapshots(): Promise<OpsReportSnapshotType[]> {
    return this.opsService.listReportSnapshots();
  }

  @Query(() => [OpsAlertType])
  opsAlerts(): Promise<OpsAlertType[]> {
    return this.opsService.listOpsAlerts();
  }

  @Query(() => [LogAnalysisSessionType])
  logAnalysisSessions(): Promise<LogAnalysisSessionType[]> {
    return this.opsService.listLogAnalysisSessions();
  }

  @Query(() => [OpsSettingType])
  opsSettings(): Promise<OpsSettingType[]> {
    return this.opsService.listOpsSettings();
  }

  @Query(() => [OpsAuditLogType])
  opsAuditLogs(
    @Args("filter", { type: () => OpsAuditLogFilterInput, nullable: true })
    filter?: OpsAuditLogFilterInput
  ): Promise<OpsAuditLogType[]> {
    return this.opsService.listOpsAuditLogs(filter);
  }

  @Query(() => [QaScenarioType])
  recentQaScenarios(): Promise<QaScenarioType[]> {
    return this.opsService.recentQaScenarios();
  }

  @Mutation(() => AnalyzeLogsPayloadType)
  analyzeLogs(
    @Args("input", { type: () => AnalyzeLogsInputModel })
    input: AnalyzeLogsInputModel
  ): Promise<AnalyzeLogsPayloadType> {
    return this.opsService.analyzeLogs(input);
  }

  @Mutation(() => OpsAlertType)
  createOpsAlert(
    @Args("input", { type: () => CreateOpsAlertInput })
    input: CreateOpsAlertInput
  ): Promise<OpsAlertType> {
    return this.opsService.createOpsAlert(input);
  }

  @Mutation(() => OpsAlertType)
  markOpsAlertRead(@Args("alertId", { type: () => String }) alertId: string): Promise<OpsAlertType> {
    return this.opsService.markOpsAlertRead(alertId);
  }

  @Mutation(() => Boolean)
  markAllOpsAlertsRead(): Promise<boolean> {
    return this.opsService.markAllOpsAlertsRead();
  }

  @Mutation(() => Boolean)
  deleteOpsAlert(@Args("alertId", { type: () => String }) alertId: string): Promise<boolean> {
    return this.opsService.deleteOpsAlert(alertId);
  }

  @Mutation(() => OpsReportSnapshotType)
  updateReportSnapshot(
    @Args("input", { type: () => UpdateReportSnapshotInput })
    input: UpdateReportSnapshotInput
  ): Promise<OpsReportSnapshotType> {
    return this.opsService.updateReportSnapshot(input);
  }

  @Mutation(() => Boolean)
  deleteReportSnapshot(
    @Args("snapshotId", { type: () => String }) snapshotId: string,
    @Args("actor", { type: () => String, nullable: true }) actor?: string
  ): Promise<boolean> {
    return this.opsService.deleteReportSnapshot(snapshotId, actor);
  }

  @Mutation(() => OpsSettingType)
  upsertOpsSetting(
    @Args("input", { type: () => UpsertOpsSettingInput })
    input: UpsertOpsSettingInput
  ): Promise<OpsSettingType> {
    return this.opsService.upsertOpsSetting(input);
  }

  @Mutation(() => IssueType)
  updateIssueStatus(
    @Args("input", { type: () => UpdateIssueStatusInput })
    input: UpdateIssueStatusInput
  ): Promise<IssueType> {
    return this.opsService.updateIssueStatus(input);
  }

  @Mutation(() => IssueType)
  assignIssue(
    @Args("input", { type: () => AssignIssueInput })
    input: AssignIssueInput
  ): Promise<IssueType> {
    return this.opsService.assignIssue(input);
  }

  @Mutation(() => IssueType)
  addIssueComment(
    @Args("input", { type: () => AddIssueCommentInput })
    input: AddIssueCommentInput
  ): Promise<IssueType> {
    return this.opsService.addIssueComment(input);
  }

  @Mutation(() => DeploymentType)
  registerDeployment(
    @Args("input", { type: () => RegisterDeploymentInput })
    input: RegisterDeploymentInput
  ): Promise<DeploymentType> {
    return this.opsService.registerDeployment(input);
  }

  @Mutation(() => QaScenarioType)
  generateQaScenario(
    @Args("input", { type: () => QaAssistantInputModel })
    input: QaAssistantInputModel
  ): Promise<QaScenarioType> {
    return this.opsService.generateQaScenario(input);
  }

  @Mutation(() => Boolean)
  deleteQaScenario(
    @Args("scenarioId", { type: () => String })
    scenarioId: string
  ): Promise<boolean> {
    return this.opsService.deleteQaScenario(scenarioId);
  }
}
