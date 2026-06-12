import type { Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { PrismaService } from "../../integration/db/prisma.service.js";

export type WriteOpsAuditLogInput = {
  actor?: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  severity?: string;
  summary: string;
  beforeValue?: Prisma.InputJsonValue | null;
  afterValue?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue;
};

export const writeOpsAuditLog = async (
  prisma: PrismaService,
  logger: Logger,
  input: WriteOpsAuditLogInput
): Promise<void> => {
  await prisma.opsAuditLog.create({
    data: {
      actor: input.actor?.trim() || "system",
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      severity: input.severity ?? "info",
      summary: input.summary,
      beforeValue: input.beforeValue ?? undefined,
      afterValue: input.afterValue ?? undefined,
      metadata: input.metadata ?? {}
    }
  }).catch((error) => {
    logger.warn(`[audit] failed action=${input.action} target=${input.targetType}:${input.targetId ?? "-"} ${String(error)}`);
  });
};
