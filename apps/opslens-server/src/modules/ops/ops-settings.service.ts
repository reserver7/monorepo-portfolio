import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../integration/db/prisma.service.js";
import type { OpsAuditLogFilterInput, UpsertOpsSettingInput } from "./ops.inputs.js";
import { writeOpsAuditLog } from "./ops-audit-writer.js";
import type { OpsAuditLogType, OpsSettingType } from "./ops.types.js";

@Injectable()
export class OpsSettingsService {
  private readonly logger = new Logger(OpsSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listOpsSettings(): Promise<OpsSettingType[]> {
    const settings = await this.prisma.opsSetting.findMany({
      orderBy: { key: "asc" }
    });

    return settings.map((setting) => ({
      id: setting.id,
      key: setting.key,
      value: JSON.stringify(setting.value),
      description: setting.description,
      category: setting.category,
      riskLevel: setting.riskLevel,
      editable: setting.editable,
      updatedBy: setting.updatedBy,
      changeReason: setting.changeReason,
      updatedAt: setting.updatedAt
    }));
  }

  async listOpsAuditLogs(filter?: OpsAuditLogFilterInput): Promise<OpsAuditLogType[]> {
    const where: Prisma.OpsAuditLogWhereInput = {};
    const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
    if (filter?.actor) where.actor = { contains: filter.actor, mode: "insensitive" };
    if (filter?.action) where.action = filter.action;
    if (filter?.targetType) where.targetType = filter.targetType;
    if (filter?.severity) where.severity = filter.severity;
    if (filter?.query) {
      where.OR = [
        { summary: { contains: filter.query, mode: "insensitive" } },
        { action: { contains: filter.query, mode: "insensitive" } },
        { targetType: { contains: filter.query, mode: "insensitive" } }
      ];
    }
    if (filter?.from || filter?.to) {
      where.createdAt = {
        gte: filter.from ? new Date(filter.from) : undefined,
        lte: filter.to ? new Date(filter.to) : undefined
      };
    }

    const logs = await this.prisma.opsAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return logs.map((log) => ({
      id: log.id,
      actor: log.actor,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      severity: log.severity,
      summary: log.summary,
      beforeValue: log.beforeValue == null ? null : JSON.stringify(log.beforeValue),
      afterValue: log.afterValue == null ? null : JSON.stringify(log.afterValue),
      metadata: JSON.stringify(log.metadata),
      createdAt: log.createdAt
    }));
  }

  async upsertOpsSetting(input: UpsertOpsSettingInput, actor?: string): Promise<OpsSettingType> {
    let value: Prisma.InputJsonValue;
    try {
      value = JSON.parse(input.value) as Prisma.InputJsonValue;
    } catch {
      throw new BadRequestException("value는 JSON 문자열이어야 합니다.");
    }

    const previous = await this.prisma.opsSetting.findUnique({ where: { key: input.key } });
    if (previous && !previous.editable) {
      throw new BadRequestException("읽기 전용 운영 설정은 화면에서 수정할 수 없습니다.");
    }

    const category = input.category?.trim() || previous?.category || "general";
    const riskLevel = input.riskLevel?.trim() || previous?.riskLevel || "low";
    const editable = input.editable ?? previous?.editable ?? true;
    const updatedBy = actor?.trim() || input.updatedBy?.trim() || "operator";
    const changeReason = input.changeReason?.trim() || null;

    const setting = await this.prisma.opsSetting.upsert({
      where: { key: input.key },
      update: {
        value,
        description: input.description?.trim() || null,
        category,
        riskLevel,
        editable,
        updatedBy,
        changeReason
      },
      create: {
        key: input.key,
        value,
        description: input.description?.trim() || null,
        category,
        riskLevel,
        editable,
        updatedBy,
        changeReason
      }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor: setting.updatedBy,
      action: "setting.upserted",
      targetType: "OpsSetting",
      targetId: setting.id,
      summary: `${setting.key} 운영 설정 저장`,
      severity: setting.riskLevel === "critical" || setting.riskLevel === "high" ? "warning" : "info",
      beforeValue: previous?.value as Prisma.InputJsonValue | undefined,
      afterValue: setting.value as Prisma.InputJsonValue,
      metadata: { key: setting.key, category: setting.category, riskLevel: setting.riskLevel, changeReason }
    });

    return {
      id: setting.id,
      key: setting.key,
      value: JSON.stringify(setting.value),
      description: setting.description,
      category: setting.category,
      riskLevel: setting.riskLevel,
      editable: setting.editable,
      updatedBy: setting.updatedBy,
      changeReason: setting.changeReason,
      updatedAt: setting.updatedAt
    };
  }
}
