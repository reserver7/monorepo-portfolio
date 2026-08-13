ALTER TABLE "Issue"
  ADD COLUMN "commander" TEXT,
  ADD COLUMN "lastStatusUpdate" TEXT,
  ADD COLUMN "nextUpdateAt" TIMESTAMP(3);
