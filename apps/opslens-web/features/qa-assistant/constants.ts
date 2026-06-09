import type { QaAudience, QaFormValues } from "./types";

export const QA_AUDIENCE_LABELS: Record<QaAudience, string> = {
  qa: "QA 중심",
  developer: "개발자 중심",
  pm: "PM/비개발자 중심"
};

export const QA_FORM_DEFAULT_VALUES: QaFormValues = {
  featureName: "",
  changedScreens: "",
  relatedApis: "",
  releaseNote: "",
  audience: "qa"
};

export const QA_SAMPLE_VALUES: QaFormValues = {
  featureName: "결제 승인 실패 재시도 플로우 개선",
  changedScreens: "결제 페이지\n결제 완료 페이지\n주문 상세",
  relatedApis: "POST /payments/authorize\nGET /orders/{id}\nGET /payments/{paymentId}",
  releaseNote: "승인 실패 시 재시도 가능 상태를 명확히 표시하고, 중복 결제 방지를 위해 재시도 버튼을 3초간 잠급니다.",
  audience: "qa"
};

export const QA_NEUTRAL_BADGE_CLASS = "border border-default bg-surface-elevated font-semibold";
export const QA_STATUS_BADGE_CLASS = "border border-current/20 font-semibold";
