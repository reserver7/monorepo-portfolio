ALTER TABLE "Issue"
  ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'P2',
  ADD COLUMN "slaDueAt" TIMESTAMP(3),
  ADD COLUMN "escalationLevel" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "QaScenario"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN "owner" TEXT NOT NULL DEFAULT 'QA 담당자',
  ADD COLUMN "reviewer" TEXT,
  ADD COLUMN "executionStatus" TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN "executedAt" TIMESTAMP(3),
  ADD COLUMN "notes" TEXT;

CREATE TABLE "LogAnalysisSession" (
  "id" TEXT NOT NULL,
  "environment" "OpsEnvironment" NOT NULL,
  "serviceName" TEXT NOT NULL,
  "source" "LogSource" NOT NULL,
  "requestedBy" TEXT NOT NULL DEFAULT 'unknown',
  "deploymentVersion" TEXT,
  "rawLineCount" INTEGER NOT NULL,
  "clusterTotalCount" INTEGER NOT NULL,
  "clusterDisplayedCount" INTEGER NOT NULL,
  "createdIssues" INTEGER NOT NULL DEFAULT 0,
  "updatedIssues" INTEGER NOT NULL DEFAULT 0,
  "topClusterTitle" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LogAnalysisSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpsAlert" (
  "id" TEXT NOT NULL,
  "level" "IssueSeverity" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "link" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpsAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpsReportSnapshot" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "environment" "OpsEnvironment",
  "riskLevel" TEXT NOT NULL,
  "executiveSummary" TEXT NOT NULL,
  "technicalSummary" TEXT NOT NULL,
  "shareText" TEXT NOT NULL,
  "generatedBy" TEXT NOT NULL DEFAULT 'system',
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OpsReportSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpsSetting" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "description" TEXT,
  "updatedBy" TEXT NOT NULL DEFAULT 'system',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpsSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpsSetting_key_key" ON "OpsSetting"("key");
