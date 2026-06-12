import { Field, GraphQLISODateTime, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SeverityCountType {
  @Field(() => String)
  severity!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class TrendPointType {
  @Field(() => String)
  hour!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class RepeatedErrorType {
  @Field(() => String)
  issueId!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  titleKey?: string;

  @Field(() => String)
  severity!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class DashboardSummaryType {
  @Field(() => Int)
  todayIssueCount!: number;

  @Field(() => [SeverityCountType])
  severityDistribution!: SeverityCountType[];

  @Field(() => [TrendPointType])
  errorTrend24h!: TrendPointType[];

  @Field(() => [RepeatedErrorType])
  topRepeatedErrors!: RepeatedErrorType[];

  @Field(() => [RepeatedErrorType])
  newAfterLatestDeployment!: RepeatedErrorType[];

  @Field(() => String)
  aiBriefing!: string;
}

@ObjectType()
export class ReportKpiType {
  @Field(() => String)
  label!: string;

  @Field(() => String)
  value!: string;

  @Field(() => String)
  helper!: string;

  @Field(() => String)
  tone!: string;
}

@ObjectType()
export class ReportActionItemType {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  description!: string;

  @Field(() => String)
  owner!: string;

  @Field(() => String)
  priority!: string;
}

@ObjectType()
export class ReportIssueType {
  @Field(() => String)
  issueId!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  severity!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String)
  serviceName!: string;

  @Field(() => Int)
  occurrenceCount!: number;
}

@ObjectType()
export class OpsReportType {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  generatedAt!: string;

  @Field(() => String)
  riskLevel!: string;

  @Field(() => String)
  executiveSummary!: string;

  @Field(() => String)
  technicalSummary!: string;

  @Field(() => String)
  shareText!: string;

  @Field(() => [ReportKpiType])
  kpis!: ReportKpiType[];

  @Field(() => [ReportActionItemType])
  actionItems!: ReportActionItemType[];

  @Field(() => [ReportIssueType])
  priorityIssues!: ReportIssueType[];
}

@ObjectType()
export class OpsReportSnapshotType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  environment?: string | null;

  @Field(() => String)
  riskLevel!: string;

  @Field(() => String)
  executiveSummary!: string;

  @Field(() => String)
  technicalSummary!: string;

  @Field(() => String)
  shareText!: string;

  @Field(() => String)
  generatedBy!: string;

  @Field(() => Boolean)
  pinned!: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  sharedAt?: Date | null;

  @Field(() => GraphQLISODateTime)
  generatedAt!: Date;
}

@ObjectType()
export class OpsAuditLogType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  actor!: string;

  @Field(() => String)
  action!: string;

  @Field(() => String)
  targetType!: string;

  @Field(() => String, { nullable: true })
  targetId?: string | null;

  @Field(() => String)
  severity!: string;

  @Field(() => String)
  summary!: string;

  @Field(() => String, { nullable: true })
  beforeValue?: string | null;

  @Field(() => String, { nullable: true })
  afterValue?: string | null;

  @Field(() => String)
  metadata!: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}

@ObjectType()
export class OpsAlertType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  level!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  message!: string;

  @Field(() => String)
  source!: string;

  @Field(() => String, { nullable: true })
  link?: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  readAt?: Date | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}

@ObjectType()
export class LogAnalysisSessionType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  environment!: string;

  @Field(() => String)
  serviceName!: string;

  @Field(() => String)
  source!: string;

  @Field(() => String)
  requestedBy!: string;

  @Field(() => String, { nullable: true })
  deploymentVersion?: string | null;

  @Field(() => Int)
  rawLineCount!: number;

  @Field(() => Int)
  clusterTotalCount!: number;

  @Field(() => Int)
  clusterDisplayedCount!: number;

  @Field(() => Int)
  createdIssues!: number;

  @Field(() => Int)
  updatedIssues!: number;

  @Field(() => String, { nullable: true })
  topClusterTitle?: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}

@ObjectType()
export class OpsSettingType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  key!: string;

  @Field(() => String)
  value!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String)
  category!: string;

  @Field(() => String)
  riskLevel!: string;

  @Field(() => Boolean)
  editable!: boolean;

  @Field(() => String)
  updatedBy!: string;

  @Field(() => String, { nullable: true })
  changeReason?: string | null;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

@ObjectType()
export class ErrorClusterType {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  normalizedMessage!: string;

  @Field(() => String)
  severity!: string;

  @Field(() => Int)
  count!: number;

  @Field(() => GraphQLISODateTime)
  firstSeen!: Date;

  @Field(() => GraphQLISODateTime)
  lastSeen!: Date;

  @Field(() => [String])
  probableCauses!: string[];

  @Field(() => [String])
  suggestedActions!: string[];

  @Field(() => String)
  affectedArea!: string;

  @Field(() => String)
  deploymentCorrelation!: string;

  @Field(() => String)
  reproductionGuide!: string;
}

@ObjectType()
export class AnalyzeLogsPayloadType {
  @Field(() => Int)
  createdIssues!: number;

  @Field(() => Int)
  updatedIssues!: number;

  @Field(() => Int)
  clusterTotalCount!: number;

  @Field(() => Int)
  clusterDisplayedCount!: number;

  @Field(() => [ErrorClusterType])
  clusters!: ErrorClusterType[];
}

@ObjectType()
export class LogEventType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  rawMessage!: string;

  @Field(() => String)
  normalizedMessage!: string;

  @Field(() => String)
  source!: string;

  @Field(() => String)
  level!: string;

  @Field(() => GraphQLISODateTime)
  occurredAt!: Date;

  @Field(() => String, { nullable: true })
  endpoint?: string;

  @Field(() => String, { nullable: true })
  page?: string;

  @Field(() => String, { nullable: true })
  userId?: string;
}

@ObjectType()
export class IssueCommentType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  author!: string;

  @Field(() => String)
  body!: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}

@ObjectType()
export class IssueType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  severity!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String)
  priority!: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  slaDueAt?: Date | null;

  @Field(() => Int)
  escalationLevel!: number;

  @Field(() => String)
  summary!: string;

  @Field(() => [String])
  probableCauses!: string[];

  @Field(() => [String])
  suggestedActions!: string[];

  @Field(() => String)
  reproductionGuide!: string;

  @Field(() => Int)
  occurrenceCount!: number;

  @Field(() => String)
  serviceName!: string;

  @Field(() => String)
  environment!: string;

  @Field(() => String, { nullable: true })
  assignee?: string;

  @Field(() => String, { nullable: true })
  affectedArea?: string;

  @Field(() => String, { nullable: true })
  deploymentCorrelation?: string;

  @Field(() => String, { nullable: true })
  deploymentVersion?: string;

  @Field(() => GraphQLISODateTime)
  firstOccurredAt!: Date;

  @Field(() => GraphQLISODateTime)
  lastOccurredAt!: Date;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;

  @Field(() => [LogEventType])
  logs!: LogEventType[];

  @Field(() => [IssueCommentType])
  comments!: IssueCommentType[];
}

@ObjectType()
export class IssueListPayloadType {
  @Field(() => [IssueType])
  items!: IssueType[];

  @Field(() => Int)
  totalCount!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  pageSize!: number;
}

@ObjectType()
export class IssueSummaryType {
  @Field(() => Int)
  open!: number;

  @Field(() => Int)
  criticalHigh!: number;

  @Field(() => Int)
  unassigned!: number;

  @Field(() => Int)
  slaRisk!: number;
}

@ObjectType()
export class DeploymentType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  version!: string;

  @Field(() => String)
  environment!: string;

  @Field(() => String)
  changelog!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String)
  owner!: string;

  @Field(() => String, { nullable: true })
  approver?: string | null;

  @Field(() => [String])
  scopeTags!: string[];

  @Field(() => [String])
  checklist!: string[];

  @Field(() => String, { nullable: true })
  rollbackCriteria?: string | null;

  @Field(() => Int)
  monitoringWindowMin!: number;

  @Field(() => GraphQLISODateTime)
  deployedAt!: Date;
}

@ObjectType()
export class DeploymentImpactItemType {
  @Field(() => String)
  issueId!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  severity!: string;

  @Field(() => String)
  serviceName!: string;

  @Field(() => Int)
  beforeCount!: number;

  @Field(() => Int)
  afterCount!: number;

  @Field(() => Int)
  delta!: number;
}

@ObjectType()
export class DeploymentImpactReportType {
  @Field(() => String)
  version!: string;

  @Field(() => String)
  environment!: string;

  @Field(() => GraphQLISODateTime)
  deployedAt!: Date;

  @Field(() => Int)
  increasedIssueCount!: number;

  @Field(() => Int)
  totalAfterErrorCount!: number;

  @Field(() => String)
  riskLevel!: string;

  @Field(() => String)
  recommendedAction!: string;

  @Field(() => Int)
  monitoringWindowMin!: number;

  @Field(() => [DeploymentImpactItemType])
  increasedIssues!: DeploymentImpactItemType[];

  @Field(() => String)
  summary!: string;
}

@ObjectType()
export class QaScenarioType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  featureName!: string;

  @Field(() => [String])
  generatedCases!: string[];

  @Field(() => [String])
  riskPoints!: string[];

  @Field(() => [String])
  regressionTargets!: string[];

  @Field(() => String)
  audience!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String)
  owner!: string;

  @Field(() => String, { nullable: true })
  reviewer?: string | null;

  @Field(() => String)
  executionStatus!: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  executedAt?: Date | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}
