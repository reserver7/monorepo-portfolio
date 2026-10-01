ALTER TABLE "OpsAuditLog"
  ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'unreviewed',
  ADD COLUMN "reviewedBy" TEXT,
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE INDEX "OpsAuditLog_reviewStatus_severity_idx" ON "OpsAuditLog"("reviewStatus", "severity");
CREATE INDEX "OpsAuditLog_reviewedBy_idx" ON "OpsAuditLog"("reviewedBy");
