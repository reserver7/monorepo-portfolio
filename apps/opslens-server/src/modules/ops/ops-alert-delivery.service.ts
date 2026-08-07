import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { OpsAlert } from "@prisma/client";
import { env } from "../../config/env.js";
import { PrismaService } from "../../integration/db/prisma.service.js";
import { OpsSlackNotifier } from "./ops-slack-notifier.js";
import type { OpsNotificationDeliveryType } from "./ops.types.js";

@Injectable()
export class OpsAlertDeliveryService implements OnModuleInit {
  private readonly logger = new Logger(OpsAlertDeliveryService.name);

  constructor(private readonly prisma: PrismaService, private readonly slackNotifier: OpsSlackNotifier) {}

  onModuleInit(): void {
    const timer = setInterval(() => {
      void this.retryPending().catch((error) => {
        this.logger.warn(`알림 delivery 재시도 작업 오류: ${error instanceof Error ? error.message : String(error)}`);
      });
    }, 60_000);
    timer.unref();
  }

  async enqueue(alert: OpsAlert): Promise<void> {
    if (!env.OPS_SLACK_WEBHOOK_URL || !["critical", "high"].includes(alert.level)) return;
    const delivery = await this.prisma.opsNotificationDelivery.upsert({
      where: { alertId_channel: { alertId: alert.id, channel: "slack" } },
      update: { status: "pending", nextAttemptAt: new Date(), lastError: null },
      create: { alertId: alert.id, channel: "slack", nextAttemptAt: new Date() }
    });
    await this.deliver(delivery.id, alert);
  }

  async retryPending(): Promise<number> {
    const deliveries = await this.prisma.opsNotificationDelivery.findMany({
      where: { channel: "slack", status: { in: ["pending", "failed"] }, OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }] },
      take: 50
    });
    for (const delivery of deliveries) {
      const alert = await this.prisma.opsAlert.findUnique({ where: { id: delivery.alertId } });
      if (alert) await this.deliver(delivery.id, alert);
    }
    return deliveries.length;
  }

  async retryDelivery(deliveryId: string): Promise<boolean> {
    const delivery = await this.prisma.opsNotificationDelivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) return false;
    const alert = await this.prisma.opsAlert.findUnique({ where: { id: delivery.alertId } });
    if (!alert) return false;
    await this.deliver(delivery.id, alert);
    return true;
  }

  async listDeliveries(): Promise<OpsNotificationDeliveryType[]> {
    return this.prisma.opsNotificationDelivery.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  }

  private async deliver(deliveryId: string, alert: OpsAlert): Promise<void> {
    try {
      await this.slackNotifier.notify(alert);
      await this.prisma.opsNotificationDelivery.update({ where: { id: deliveryId }, data: { status: "sent", attempts: { increment: 1 }, deliveredAt: new Date(), nextAttemptAt: null, lastError: null } });
    } catch (error) {
      const existing = await this.prisma.opsNotificationDelivery.findUnique({ where: { id: deliveryId }, select: { attempts: true } });
      const attempts = (existing?.attempts ?? 0) + 1;
      const retryDelayMs = Math.min(60_000 * 2 ** Math.min(attempts, 6), 60 * 60 * 1000);
      await this.prisma.opsNotificationDelivery.update({ where: { id: deliveryId }, data: { status: "failed", attempts, lastError: error instanceof Error ? error.message : String(error), nextAttemptAt: new Date(Date.now() + retryDelayMs) } });
      this.logger.warn(`알림 delivery 실패 (${deliveryId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
