CREATE TABLE "OpsLogSavedView" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "visibility" TEXT NOT NULL DEFAULT 'team',
  "severity" TEXT NOT NULL DEFAULT 'all',
  "query" TEXT NOT NULL DEFAULT '',
  "sort" TEXT NOT NULL DEFAULT 'countDesc',
  "isFavorite" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpsLogSavedView_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OpsLogSavedView_visibility_updatedAt_idx" ON "OpsLogSavedView"("visibility", "updatedAt");
CREATE INDEX "OpsLogSavedView_owner_updatedAt_idx" ON "OpsLogSavedView"("owner", "updatedAt");
