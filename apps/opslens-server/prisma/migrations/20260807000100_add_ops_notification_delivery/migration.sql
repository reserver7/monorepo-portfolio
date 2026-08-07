CREATE TABLE "OpsNotificationDelivery" (
  "id" TEXT NOT NULL,
  "alertId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "nextAttemptAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpsNotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpsNotificationDelivery_alertId_channel_key" ON "OpsNotificationDelivery"("alertId", "channel");
CREATE INDEX "OpsNotificationDelivery_status_nextAttemptAt_idx" ON "OpsNotificationDelivery"("status", "nextAttemptAt");
