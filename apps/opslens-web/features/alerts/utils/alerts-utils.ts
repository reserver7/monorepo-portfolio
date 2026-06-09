import type { OpsAlert } from "../types";

export const createOpsAlertId = (): string => `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const getOpsAlertTimestamp = () => new Date().toISOString();

export const createOpsAlertSeedItems = (): OpsAlert[] => [
  {
    id: "seed-alert-1",
    title: "결제 승인 단계 TypeError 급증",
    level: "critical",
    source: "payments-api",
    createdAt: new Date(Date.now() - 2 * 60_000).toISOString()
  },
  {
    id: "seed-alert-2",
    title: "주문 상세 API 500 에러 재발",
    level: "high",
    source: "orders-api",
    createdAt: new Date(Date.now() - 7 * 60_000).toISOString(),
    readAt: new Date(Date.now() - 4 * 60_000).toISOString()
  }
];
