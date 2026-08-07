import { Args, Context, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { OpsAuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { OpsPermissionGuard, RequireOpsPermission } from "../auth/auth.roles.js";
import {
  AddIssueCommentInput,
  AnalyzeLogsInputModel,
  AssignIssueInput,
  BulkUpdateIssuesInput,
  CreateOpsAlertInput,
  DashboardFilterInput,
  DeploymentImpactInput,
  IssueFilterInput,
  OpsAuditLogFilterInput,
  QaAssistantInputModel,
  RegisterDeploymentInput,
  UpsertOpsSettingInput,
  UpdateReportSnapshotInput,
  UpdateIssueStatusInput,
  UpdateIncidentClosureInput,
  UpdateReportActionInput
} from "./ops.inputs.js";
import {
  AnalyzeLogsPayloadType,
  DashboardSummaryType,
  ServiceHealthType,
  DeploymentImpactReportType,
  DeploymentReadinessType,
  DeploymentType,
  IssueListPayloadType,
  IssueSummaryType,
  IssueType,
  IncidentTimelineItemType,
  LogAnalysisSessionType,
  OpsAuditLogType,
  OpsAlertType,
  OpsNotificationDeliveryType,
  OpsReportType,
  OpsReportActionType,
  OpsReportSnapshotType,
  OpsSettingType,
  QaScenarioType
} from "./ops.types.js";
import { OpsService } from "./ops.service.js";

@Resolver()
@UseGuards(OpsAuthGuard, OpsPermissionGuard)
export class OpsResolver {
  constructor(private readonly opsService: OpsService) {}

  private actor(context: { req?: AuthenticatedRequest }): string | undefined {
    return context.req?.authUser?.email;
  }

  @Query(() => DashboardSummaryType)
  dashboardSummary(
    @Args("filter", { type: () => DashboardFilterInput, nullable: true })
    filter?: DashboardFilterInput
  ): Promise<DashboardSummaryType> {
    return this.opsService.getDashboardSummary(filter);
  }

  @Query(() => [ServiceHealthType])
  serviceHealth(
    @Args("filter", { type: () => DashboardFilterInput, nullable: true })
    filter?: DashboardFilterInput
  ): Promise<ServiceHealthType[]> {
    return this.opsService.getServiceHealth(filter);
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

  @Query(() => [IncidentTimelineItemType])
  incidentTimeline(@Args("issueId", { type: () => String }) issueId: string): Promise<IncidentTimelineItemType[]> {
    return this.opsService.getIncidentTimeline(issueId);
  }

  @Query(() => [DeploymentType])
  deployments(
    @Args("environment", { type: () => String, nullable: true })
    environment?: string
  ): Promise<DeploymentType[]> {
    return this.opsService.listDeployments(environment);
  }

  @Query(() => DeploymentReadinessType)
  deploymentReadiness(@Args("environment", { type: () => String }) environment: string): Promise<DeploymentReadinessType> {
    return this.opsService.getDeploymentReadiness(environment);
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

  @Query(() => [OpsReportActionType])
  reportActions(@Args("snapshotId", { type: () => String }) snapshotId: string): Promise<OpsReportActionType[]> {
    return this.opsService.listReportActions(snapshotId);
  }

  @Query(() => [OpsAlertType])
  opsAlerts(): Promise<OpsAlertType[]> {
    return this.opsService.listOpsAlerts();
  }

  @Query(() => [OpsNotificationDeliveryType])
  @RequireOpsPermission("admin")
  notificationDeliveries(): Promise<OpsNotificationDeliveryType[]> {
    return this.opsService.listNotificationDeliveries();
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
  @RequireOpsPermission("operate")
  analyzeLogs(
    @Args("input", { type: () => AnalyzeLogsInputModel })
    input: AnalyzeLogsInputModel
  ): Promise<AnalyzeLogsPayloadType> {
    return this.opsService.analyzeLogs(input);
  }

  @Mutation(() => OpsAlertType)
  @RequireOpsPermission("operate")
  createOpsAlert(
    @Args("input", { type: () => CreateOpsAlertInput })
    input: CreateOpsAlertInput
  ): Promise<OpsAlertType> {
    return this.opsService.createOpsAlert(input);
  }

  @Mutation(() => OpsAlertType)
  @RequireOpsPermission("operate")
  markOpsAlertRead(@Args("alertId", { type: () => String }) alertId: string): Promise<OpsAlertType> {
    return this.opsService.markOpsAlertRead(alertId);
  }

  @Mutation(() => Boolean)
  @RequireOpsPermission("operate")
  markAllOpsAlertsRead(): Promise<boolean> {
    return this.opsService.markAllOpsAlertsRead();
  }

  @Mutation(() => Boolean)
  @RequireOpsPermission("admin")
  deleteOpsAlert(@Args("alertId", { type: () => String }) alertId: string): Promise<boolean> {
    return this.opsService.deleteOpsAlert(alertId);
  }

  @Mutation(() => Number)
  @RequireOpsPermission("admin")
  retryPendingAlertDeliveries(): Promise<number> {
    return this.opsService.retryPendingAlertDeliveries();
  }

  @Mutation(() => OpsReportSnapshotType)
  @RequireOpsPermission("operate")
  updateReportSnapshot(
    @Args("input", { type: () => UpdateReportSnapshotInput })
    input: UpdateReportSnapshotInput
  ): Promise<OpsReportSnapshotType> {
    return this.opsService.updateReportSnapshot(input);
  }

  @Mutation(() => OpsReportActionType)
  @RequireOpsPermission("operate")
  updateReportAction(
    @Args("input", { type: () => UpdateReportActionInput }) input: UpdateReportActionInput,
    @Context() context: { req?: AuthenticatedRequest }
  ): Promise<OpsReportActionType> {
    return this.opsService.updateReportAction(input, this.actor(context));
  }

  @Mutation(() => Boolean)
  @RequireOpsPermission("admin")
  deleteReportSnapshot(
    @Args("snapshotId", { type: () => String }) snapshotId: string,
    @Args("actor", { type: () => String, nullable: true }) actor: string | undefined
  ): Promise<boolean> {
    return this.opsService.deleteReportSnapshot(snapshotId, actor);
  }

  @Mutation(() => OpsSettingType)
  @RequireOpsPermission("admin")
  upsertOpsSetting(
    @Args("input", { type: () => UpsertOpsSettingInput })
    input: UpsertOpsSettingInput,
    @Context() context: { req?: AuthenticatedRequest }
  ): Promise<OpsSettingType> {
    return this.opsService.upsertOpsSetting(input, this.actor(context));
  }

  @Mutation(() => IssueType)
  @RequireOpsPermission("operate")
  updateIssueStatus(
    @Args("input", { type: () => UpdateIssueStatusInput })
    input: UpdateIssueStatusInput,
    @Context() context: { req?: AuthenticatedRequest }
  ): Promise<IssueType> {
    return this.opsService.updateIssueStatus(input, this.actor(context));
  }

  @Mutation(() => IssueType)
  @RequireOpsPermission("operate")
  updateIncidentClosure(
    @Args("input", { type: () => UpdateIncidentClosureInput }) input: UpdateIncidentClosureInput,
    @Context() context: { req?: AuthenticatedRequest }
  ): Promise<IssueType> {
    return this.opsService.updateIncidentClosure(input, this.actor(context));
  }

  @Mutation(() => IssueType)
  @RequireOpsPermission("operate")
  assignIssue(
    @Args("input", { type: () => AssignIssueInput })
    input: AssignIssueInput,
    @Context() context: { req?: AuthenticatedRequest }
  ): Promise<IssueType> {
    return this.opsService.assignIssue(input, this.actor(context));
  }

  @Mutation(() => IssueType)
  @RequireOpsPermission("operate")
  addIssueComment(
    @Args("input", { type: () => AddIssueCommentInput })
    input: AddIssueCommentInput,
    @Context() context: { req?: AuthenticatedRequest }
  ): Promise<IssueType> {
    return this.opsService.addIssueComment(input, this.actor(context));
  }

  @Mutation(() => Int)
  @RequireOpsPermission("operate")
  bulkUpdateIssues(@Args("input", { type: () => BulkUpdateIssuesInput }) input: BulkUpdateIssuesInput, @Context() context: { req?: AuthenticatedRequest }): Promise<number> {
    return this.opsService.bulkUpdateIssues(input, this.actor(context));
  }

  @Mutation(() => DeploymentType)
  @RequireOpsPermission("operate")
  registerDeployment(
    @Args("input", { type: () => RegisterDeploymentInput })
    input: RegisterDeploymentInput,
    @Context() context: { req?: AuthenticatedRequest }
  ): Promise<DeploymentType> {
    return this.opsService.registerDeployment(input, this.actor(context));
  }

  @Mutation(() => QaScenarioType)
  @RequireOpsPermission("operate")
  generateQaScenario(
    @Args("input", { type: () => QaAssistantInputModel })
    input: QaAssistantInputModel
  ): Promise<QaScenarioType> {
    return this.opsService.generateQaScenario(input);
  }

  @Mutation(() => Boolean)
  @RequireOpsPermission("admin")
  deleteQaScenario(
    @Args("scenarioId", { type: () => String })
    scenarioId: string
  ): Promise<boolean> {
    return this.opsService.deleteQaScenario(scenarioId);
  }
}
