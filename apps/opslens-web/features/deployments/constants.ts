import type { DeploymentFormValues } from "./types";

export const DEPLOYMENT_FORM_DEFAULT_VALUES: DeploymentFormValues = {
  version: "",
  status: "completed",
  owner: "운영담당자",
  approver: "",
  overrideReason: "",
  scopeTags: [],
  monitoringWindowMin: 60,
  rollbackCriteria: "Critical 증가, 결제/로그인 실패, 에러 이벤트 100건 이상",
  checklist: ["배포 전 알림 확인", "핵심 플로우 스모크 테스트", "배포 후 로그 모니터링"],
  changelog: ""
};

export const DEPLOYMENT_STATUS_OPTIONS = [
  { label: "준비중", value: "planned" },
  { label: "배포중", value: "deploying" },
  { label: "완료", value: "completed" },
  { label: "실패", value: "failed" },
  { label: "롤백", value: "rolled_back" }
] as const;

export const DEPLOYMENT_SCOPE_OPTIONS = [
  { label: "Frontend", value: "frontend" },
  { label: "API", value: "api" },
  { label: "DB", value: "db" },
  { label: "Infra", value: "infra" },
  { label: "Auth", value: "auth" },
  { label: "Payment", value: "payment" }
] as const;

export const DEPLOYMENT_MONITORING_WINDOW_OPTIONS = [
  { label: "15분", value: 15 },
  { label: "30분", value: 30 },
  { label: "1시간", value: 60 },
  { label: "3시간", value: 180 },
  { label: "24시간", value: 1440 }
] as const;

export const DEPLOYMENT_STATUS_LABELS: Record<DeploymentFormValues["status"] | string, string> = {
  planned: "준비중",
  deploying: "배포중",
  completed: "완료",
  failed: "실패",
  rolled_back: "롤백"
};

export const DEPLOYMENT_STATUS_VARIANTS = {
  planned: "secondary",
  deploying: "info",
  completed: "success",
  failed: "danger",
  rolled_back: "warning"
} as const;

export const DEPLOYMENT_RISK_LABELS = {
  normal: "정상",
  caution: "주의",
  rollback_review: "롤백 검토"
} as const;

export const DEPLOYMENT_RISK_VARIANTS = {
  normal: "success",
  caution: "warning",
  rollback_review: "danger"
} as const;
