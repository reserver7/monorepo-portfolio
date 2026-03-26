-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('new', 'analyzing', 'in_progress', 'resolved');

-- CreateEnum
CREATE TYPE "OpsEnvironment" AS ENUM ('dev', 'stage', 'prod');

-- CreateEnum
CREATE TYPE "LogSource" AS ENUM ('server', 'client', 'api', 'console', 'sentry');

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "environment" "OpsEnvironment" NOT NULL,
    "changelog" TEXT NOT NULL,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'new',
    "summary" TEXT NOT NULL,
    "probableCauses" JSONB NOT NULL,
    "suggestedActions" JSONB NOT NULL,
    "reproductionGuide" TEXT NOT NULL,
    "assignee" TEXT,
    "serviceName" TEXT NOT NULL,
    "environment" "OpsEnvironment" NOT NULL,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "firstOccurredAt" TIMESTAMP(3) NOT NULL,
    "lastOccurredAt" TIMESTAMP(3) NOT NULL,
    "affectedArea" TEXT,
    "deploymentCorrelation" TEXT,
    "deploymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEvent" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "rawMessage" TEXT NOT NULL,
    "normalizedMessage" TEXT NOT NULL,
    "source" "LogSource" NOT NULL,
    "level" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "endpoint" TEXT,
    "page" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueComment" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QaScenario" (
    "id" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "changedScreens" TEXT NOT NULL,
    "relatedApis" TEXT NOT NULL,
    "releaseNote" TEXT NOT NULL,
    "generatedCases" JSONB NOT NULL,
    "riskPoints" JSONB NOT NULL,
    "regressionTargets" JSONB NOT NULL,
    "audience" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QaScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_version_environment_key" ON "Deployment"("version", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_signature_key" ON "Issue"("signature");

-- CreateIndex
CREATE INDEX "Issue_environment_serviceName_idx" ON "Issue"("environment", "serviceName");

-- CreateIndex
CREATE INDEX "Issue_severity_status_idx" ON "Issue"("severity", "status");

-- CreateIndex
CREATE INDEX "LogEvent_occurredAt_idx" ON "LogEvent"("occurredAt");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEvent" ADD CONSTRAINT "LogEvent_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

