CREATE TABLE "OpsSecurityNotification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OpsSecurityNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpsSecurityNotification_userId_eventId_key"
  ON "OpsSecurityNotification"("userId", "eventId");
CREATE INDEX "OpsSecurityNotification_userId_readAt_createdAt_idx"
  ON "OpsSecurityNotification"("userId", "readAt", "createdAt");
