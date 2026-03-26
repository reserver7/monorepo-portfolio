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
export class DeploymentType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  version!: string;

  @Field(() => String)
  environment!: string;

  @Field(() => String)
  changelog!: string;

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

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}
