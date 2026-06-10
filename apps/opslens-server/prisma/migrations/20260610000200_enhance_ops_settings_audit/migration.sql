ALTER TABLE "OpsSetting"
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN "riskLevel" TEXT NOT NULL DEFAULT 'low',
ADD COLUMN "editable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "changeReason" TEXT;

ALTER TABLE "OpsAuditLog"
ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'info',
ADD COLUMN "beforeValue" JSONB,
ADD COLUMN "afterValue" JSONB;

CREATE INDEX "OpsSetting_category_idx" ON "OpsSetting"("category");
CREATE INDEX "OpsSetting_riskLevel_idx" ON "OpsSetting"("riskLevel");
CREATE INDEX "OpsAuditLog_actor_idx" ON "OpsAuditLog"("actor");
CREATE INDEX "OpsAuditLog_action_idx" ON "OpsAuditLog"("action");
CREATE INDEX "OpsAuditLog_severity_idx" ON "OpsAuditLog"("severity");
