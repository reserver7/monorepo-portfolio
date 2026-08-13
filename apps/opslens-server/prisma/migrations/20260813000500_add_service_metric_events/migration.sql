CREATE TABLE "ServiceMetricEvent" (
  "id" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  "environment" "OpsEnvironment" NOT NULL,
  "requests" INTEGER NOT NULL,
  "errors" INTEGER NOT NULL,
  "latencyP95Ms" INTEGER,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceMetricEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceMetricEvent_serviceName_environment_occurredAt_idx" ON "ServiceMetricEvent"("serviceName", "environment", "occurredAt");
CREATE INDEX "ServiceMetricEvent_environment_occurredAt_idx" ON "ServiceMetricEvent"("environment", "occurredAt");
