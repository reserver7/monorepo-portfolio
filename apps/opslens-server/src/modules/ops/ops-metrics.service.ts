import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "../../integration/db/prisma.service.js";
import { toEnvironment } from "./ops.filters.js";

type MetricInput = { serviceName: string; environment: string; requests: number; errors: number; latencyP95Ms?: number; occurredAt?: string };

@Injectable()
export class OpsMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async ingest(input: MetricInput): Promise<boolean> {
    const environment = toEnvironment(input.environment);
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    if (!environment || !input.serviceName.trim() || !Number.isInteger(input.requests) || input.requests < 0 || !Number.isInteger(input.errors) || input.errors < 0 || input.errors > input.requests || Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestException("서비스 메트릭 값이 올바르지 않습니다.");
    }
    await this.prisma.serviceMetricEvent.create({ data: { serviceName: input.serviceName.trim(), environment, requests: input.requests, errors: input.errors, latencyP95Ms: input.latencyP95Ms == null ? null : Math.max(0, Math.round(input.latencyP95Ms)), occurredAt } });
    return true;
  }

  async getSlo(serviceName: string, environmentInput: string) {
    const environment = toEnvironment(environmentInput);
    if (!environment || !serviceName.trim()) throw new BadRequestException("serviceName과 environment 값이 필요합니다.");
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [rows, setting] = await Promise.all([
      this.prisma.serviceMetricEvent.aggregate({ where: { serviceName: serviceName.trim(), environment, occurredAt: { gte: since } }, _sum: { requests: true, errors: true, latencyP95Ms: true }, _count: { _all: true } }),
      this.prisma.opsSetting.findUnique({ where: { key: "service.catalog" }, select: { value: true } })
    ]);
    let target = 99.9;
    if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) {
      const services = (setting.value as { services?: Array<{ name?: string; slo?: string }> }).services ?? [];
      const configured = services.find((item) => item.name === serviceName)?.slo;
      const parsed = configured ? Number.parseFloat(configured.replace("%", "")) : Number.NaN;
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= 100) target = parsed;
    }
    const requestCount = rows._sum.requests ?? 0;
    const errorCount = rows._sum.errors ?? 0;
    const availability = requestCount > 0 ? ((requestCount - errorCount) / requestCount) * 100 : null;
    const allowedErrors = requestCount * ((100 - target) / 100);
    const budgetConsumed = requestCount > 0 ? Math.min(100, Math.max(0, (errorCount / Math.max(allowedErrors, 0.0001)) * 100)) : null;
    return { serviceName: serviceName.trim(), environment, target, requestCount, errorCount, availability, budgetConsumed, latencyP95Ms: rows._count._all > 0 ? Math.round((rows._sum.latencyP95Ms ?? 0) / rows._count._all) : null, observedAt: rows._count._all > 0 ? since : null };
  }
}
