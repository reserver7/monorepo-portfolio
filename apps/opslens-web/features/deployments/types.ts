import type { getDeploymentImpact, getDeployments } from "@repo/opslens";

export type DeploymentFormValues = {
  version: string;
  status: "planned" | "deploying" | "completed" | "failed" | "rolled_back";
  owner: string;
  approver: string;
  scopeTags: string[];
  monitoringWindowMin: number;
  rollbackCriteria: string;
  checklist: string[];
  changelog: string;
};

export type DeploymentItem = Awaited<ReturnType<typeof getDeployments>>[number];
export type DeploymentImpact = Awaited<ReturnType<typeof getDeploymentImpact>>;
