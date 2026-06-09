import {
  DEPLOYMENT_RISK_LABELS,
  DEPLOYMENT_RISK_VARIANTS,
  DEPLOYMENT_STATUS_LABELS,
  DEPLOYMENT_STATUS_VARIANTS
} from "../constants";

type DeploymentBadgeVariant = "secondary" | "outline" | "success" | "warning" | "danger" | "info";

export const getDeploymentStatusLabel = (status: string): string => DEPLOYMENT_STATUS_LABELS[status] ?? status;

export const getDeploymentStatusVariant = (status: string): DeploymentBadgeVariant =>
  DEPLOYMENT_STATUS_VARIANTS[status as keyof typeof DEPLOYMENT_STATUS_VARIANTS] ?? "outline";

export const getDeploymentRiskLabel = (riskLevel: string): string =>
  DEPLOYMENT_RISK_LABELS[riskLevel as keyof typeof DEPLOYMENT_RISK_LABELS] ?? riskLevel;

export const getDeploymentRiskVariant = (riskLevel: string): DeploymentBadgeVariant =>
  DEPLOYMENT_RISK_VARIANTS[riskLevel as keyof typeof DEPLOYMENT_RISK_VARIANTS] ?? "outline";
