ALTER TABLE "Issue"
  ADD COLUMN "acknowledgedAt" TIMESTAMP(3),
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "rootCause" TEXT,
  ADD COLUMN "postmortemUrl" TEXT;
