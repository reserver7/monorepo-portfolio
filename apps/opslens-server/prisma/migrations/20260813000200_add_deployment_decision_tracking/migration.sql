ALTER TABLE "Deployment"
  ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "ciUrl" TEXT,
  ADD COLUMN "rollbackStatus" TEXT NOT NULL DEFAULT 'not_requested',
  ADD COLUMN "rollbackReason" TEXT,
  ADD COLUMN "rolledBackAt" TIMESTAMP(3);
