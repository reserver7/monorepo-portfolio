ALTER TABLE "OpsReportSnapshot"
  ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sharedAt" TIMESTAMP(3);

CREATE TABLE "OpsAuditLog" (
  "id" TEXT NOT NULL,
  "actor" TEXT NOT NULL DEFAULT 'system',
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OpsAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OpsAuditLog_targetType_targetId_idx" ON "OpsAuditLog"("targetType", "targetId");
CREATE INDEX "OpsAuditLog_createdAt_idx" ON "OpsAuditLog"("createdAt");
