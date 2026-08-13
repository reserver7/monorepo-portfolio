import { Field, InputType, Int } from "@nestjs/graphql";
import { IsUrl } from "class-validator";

@InputType()
export class DashboardFilterInput {
  @Field(() => String, { nullable: true })
  environment?: string;

  @Field(() => String, { nullable: true })
  serviceName?: string;

  @Field(() => String, { nullable: true })
  from?: string;

  @Field(() => String, { nullable: true })
  to?: string;

  @Field(() => String, { nullable: true })
  query?: string;
}

@InputType()
export class AnalyzeLogsInputModel {
  @Field(() => String)
  rawLogs!: string;

  @Field(() => String)
  source!: string;

  @Field(() => String)
  environment!: string;

  @Field(() => String)
  serviceName!: string;

  @Field(() => String, { nullable: true })
  deploymentVersion?: string;

  @Field(() => Int, { nullable: true, defaultValue: 12 })
  clusterLimit?: number;

  @Field(() => String, { nullable: true })
  requestedBy?: string;
}

@InputType()
export class IngestServiceMetricInput {
  @Field(() => String) serviceName!: string;
  @Field(() => String) environment!: string;
  @Field(() => Int) requests!: number;
  @Field(() => Int) errors!: number;
  @Field(() => Int, { nullable: true }) latencyP95Ms?: number;
  @Field(() => String, { nullable: true }) occurredAt?: string;
}

@InputType()
export class UpsertLogSavedViewInput {
  @Field(() => String, { nullable: true }) id?: string;
  @Field(() => String) name!: string;
  @Field(() => String) severity!: string;
  @Field(() => String) query!: string;
  @Field(() => String) sort!: string;
  @Field(() => String, { nullable: true }) visibility?: string;
  @Field(() => Boolean, { nullable: true }) isFavorite?: boolean;
}

@InputType()
export class IssueFilterInput {
  @Field(() => String, { nullable: true })
  environment?: string;

  @Field(() => String, { nullable: true })
  serviceName?: string;

  @Field(() => String, { nullable: true })
  severity?: string;

  @Field(() => String, { nullable: true })
  status?: string;

  @Field(() => String, { nullable: true })
  query?: string;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  pageSize?: number;
}

@InputType()
export class RegisterDeploymentInput {
  @Field(() => String)
  version!: string;

  @Field(() => String)
  environment!: string;

  @Field(() => String)
  changelog!: string;

  @Field(() => String, { nullable: true })
  status?: string;

  @Field(() => String, { nullable: true })
  owner?: string;

  @Field(() => String, { nullable: true })
  approver?: string;

  @Field(() => String, { nullable: true })
  ciUrl?: string;

  @Field(() => String, { nullable: true })
  overrideReason?: string;

  @Field(() => [String], { nullable: true })
  scopeTags?: string[];

  @Field(() => [String], { nullable: true })
  checklist?: string[];

  @Field(() => String, { nullable: true })
  rollbackCriteria?: string;

  @Field(() => Int, { nullable: true })
  monitoringWindowMin?: number;

  @Field(() => String, { nullable: true })
  deployedAt?: string;
}

@InputType()
export class DeploymentImpactInput {
  @Field(() => String)
  version!: string;

  @Field(() => String)
  environment!: string;
}

@InputType()
export class UpdateDeploymentDecisionInput {
  @Field(() => String)
  deploymentId!: string;

  @Field(() => String)
  decision!: string;

  @Field(() => String, { nullable: true })
  approver?: string;

  @Field(() => String, { nullable: true })
  reason?: string;
}

@InputType()
export class UpdateIssueStatusInput {
  @Field(() => String)
  issueId!: string;

  @Field(() => String)
  status!: string;
}

@InputType()
export class UpdateIncidentResponseInput {
  @Field(() => String)
  issueId!: string;

  @Field(() => String, { nullable: true })
  commander?: string;

  @Field(() => Int, { nullable: true })
  escalationLevel?: number;

  @Field(() => String, { nullable: true })
  statusUpdate?: string;

  @Field(() => String, { nullable: true })
  nextUpdateAt?: string;
}

@InputType()
export class UpdateIncidentClosureInput {
  @Field(() => String)
  issueId!: string;

  @Field(() => String, { nullable: true })
  rootCause?: string;

  @Field(() => String, { nullable: true })
  @IsUrl({ require_tld: false }, { message: "postmortemUrl은 올바른 URL이어야 합니다." })
  postmortemUrl?: string;
}

@InputType()
export class AssignIssueInput {
  @Field(() => String)
  issueId!: string;

  @Field(() => String)
  assignee!: string;
}

@InputType()
export class BulkUpdateIssuesInput {
  @Field(() => [String])
  issueIds!: string[];

  @Field(() => String, { nullable: true })
  status?: string;

  @Field(() => String, { nullable: true })
  assignee?: string;
}

@InputType()
export class AddIssueCommentInput {
  @Field(() => String)
  issueId!: string;

  @Field(() => String)
  author!: string;

  @Field(() => String)
  body!: string;
}

@InputType()
export class QaAssistantInputModel {
  @Field(() => String)
  featureName!: string;

  @Field(() => String)
  changedScreens!: string;

  @Field(() => String)
  relatedApis!: string;

  @Field(() => String)
  releaseNote!: string;

  @Field(() => String)
  audience!: string;

  @Field(() => String, { nullable: true })
  owner?: string;

  @Field(() => String, { nullable: true })
  reviewer?: string;
}

@InputType()
export class CreateOpsAlertInput {
  @Field(() => String)
  level!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  message!: string;

  @Field(() => String)
  source!: string;

  @Field(() => String, { nullable: true })
  link?: string;
}

@InputType()
export class UpsertOpsSettingInput {
  @Field(() => String)
  key!: string;

  @Field(() => String)
  value!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  category?: string;

  @Field(() => String, { nullable: true })
  riskLevel?: string;

  @Field(() => Boolean, { nullable: true })
  editable?: boolean;

  @Field(() => String, { nullable: true })
  updatedBy?: string;

  @Field(() => String, { nullable: true })
  changeReason?: string;
}

@InputType()
export class OpsAuditLogFilterInput {
  @Field(() => String, { nullable: true })
  actor?: string;

  @Field(() => String, { nullable: true })
  action?: string;

  @Field(() => String, { nullable: true })
  targetType?: string;

  @Field(() => String, { nullable: true })
  severity?: string;

  @Field(() => String, { nullable: true })
  query?: string;

  @Field(() => String, { nullable: true })
  from?: string;

  @Field(() => String, { nullable: true })
  to?: string;

  @Field(() => Int, { nullable: true, defaultValue: 50 })
  limit?: number;
}

@InputType()
export class UpdateReportSnapshotInput {
  @Field(() => String)
  snapshotId!: string;

  @Field(() => Boolean, { nullable: true })
  pinned?: boolean;

  @Field(() => Boolean, { nullable: true })
  markShared?: boolean;

  @Field(() => String, { nullable: true })
  actor?: string;
}

@InputType()
export class UpdateReportActionInput {
  @Field(() => String)
  actionId!: string;

  @Field(() => Boolean)
  completed!: boolean;

  @Field(() => String, { nullable: true })
  dueAt?: string;

  @Field(() => String, { nullable: true })
  owner?: string;

  @Field(() => String, { nullable: true })
  reopenedReason?: string;

  @Field(() => String, { nullable: true })
  actor?: string;
}
