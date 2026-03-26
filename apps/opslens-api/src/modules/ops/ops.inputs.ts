import { Field, InputType, Int } from "@nestjs/graphql";

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
export class UpdateIssueStatusInput {
  @Field(() => String)
  issueId!: string;

  @Field(() => String)
  status!: string;
}

@InputType()
export class AssignIssueInput {
  @Field(() => String)
  issueId!: string;

  @Field(() => String)
  assignee!: string;
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
}
