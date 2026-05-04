-- OpsLens performance indexes
CREATE INDEX IF NOT EXISTS "Issue_environment_lastOccurredAt_idx" ON "Issue"("environment", "lastOccurredAt");
CREATE INDEX IF NOT EXISTS "Issue_environment_updatedAt_idx" ON "Issue"("environment", "updatedAt");
CREATE INDEX IF NOT EXISTS "Issue_serviceName_lastOccurredAt_idx" ON "Issue"("serviceName", "lastOccurredAt");
CREATE INDEX IF NOT EXISTS "LogEvent_issueId_occurredAt_idx" ON "LogEvent"("issueId", "occurredAt");
