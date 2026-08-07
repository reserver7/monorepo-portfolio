import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../integration/db/prisma.service.js";
import type { CreateOpsAlertInput } from "./ops.inputs.js";
import { writeOpsAuditLog } from "./ops-audit-writer.js";
import { toSeverity } from "./ops.filters.js";
import { toOpsAlertType } from "./ops.mappers.js";
import { OpsAlertDeliveryService } from "./ops-alert-delivery.service.js";
import type { OpsAlertType } from "./ops.types.js";

@Injectable()
export class OpsAlertService {
  private readonly logger = new Logger(OpsAlertService.name);

  constructor(private readonly prisma: PrismaService, private readonly deliveryService: OpsAlertDeliveryService) {}

  async listOpsAlerts(): Promise<OpsAlertType[]> {
    const alerts = await this.prisma.opsAlert.findMany({
      orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
      take: 30
    });
    return alerts.map((alert) => toOpsAlertType(alert));
  }

  async createOpsAlert(input: CreateOpsAlertInput): Promise<OpsAlertType> {
    const level = toSeverity(input.level);
    if (!level) {
      throw new BadRequestException("level 값이 필요합니다.");
    }
    const created = await this.prisma.opsAlert.create({
      data: {
        level,
        title: input.title.trim(),
        message: input.message.trim(),
        source: input.source.trim() || "system",
        link: input.link?.trim() || null
      }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      action: "alert.created",
      targetType: "OpsAlert",
      targetId: created.id,
      summary: `${created.title} 알림 생성`,
      metadata: { level: created.level, source: created.source }
    });
    void this.deliveryService.enqueue(created);
    return toOpsAlertType(created);
  }

  async markOpsAlertRead(alertId: string): Promise<OpsAlertType> {
    const updated = await this.prisma.opsAlert.update({
      where: { id: alertId },
      data: { readAt: new Date() }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      action: "alert.read",
      targetType: "OpsAlert",
      targetId: updated.id,
      summary: `${updated.title} 알림 읽음 처리`
    });
    return toOpsAlertType(updated);
  }

  async markAllOpsAlertsRead(): Promise<boolean> {
    const result = await this.prisma.opsAlert.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      action: "alert.read_all",
      targetType: "OpsAlert",
      summary: `읽지 않은 알림 ${result.count}건 전체 읽음 처리`,
      metadata: { count: result.count }
    });
    return true;
  }

  async deleteOpsAlert(alertId: string): Promise<boolean> {
    const existing = await this.prisma.opsAlert.findUnique({
      where: { id: alertId },
      select: { id: true, title: true }
    });
    if (!existing) {
      throw new NotFoundException("알림을 찾을 수 없습니다.");
    }
    await this.prisma.opsAlert.delete({ where: { id: alertId } });
    await writeOpsAuditLog(this.prisma, this.logger, {
      action: "alert.deleted",
      targetType: "OpsAlert",
      targetId: existing.id,
      summary: `${existing.title} 알림 삭제`
    });
    return true;
  }
}
