import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import {
  AddIssueCommentInput,
  AnalyzeLogsInputModel,
  AssignIssueInput,
  DashboardFilterInput,
  DeploymentImpactInput,
  IssueFilterInput,
  QaAssistantInputModel,
  RegisterDeploymentInput,
  UpdateIssueStatusInput
} from "./ops.inputs.js";
import {
  AnalyzeLogsPayloadType,
  DashboardSummaryType,
  DeploymentImpactReportType,
  DeploymentType,
  IssueListPayloadType,
  IssueType,
  QaScenarioType
} from "./ops.types.js";
import { OpsService } from "./ops.service.js";

@Resolver()
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
}
