CREATE TABLE "OpsReportAction" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsReportAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpsReportAction_snapshotId_actionKey_key" ON "OpsReportAction"("snapshotId", "actionKey");
CREATE INDEX "OpsReportAction_snapshotId_completedAt_idx" ON "OpsReportAction"("snapshotId", "completedAt");

ALTER TABLE "OpsReportAction" ADD CONSTRAINT "OpsReportAction_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "OpsReportSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
