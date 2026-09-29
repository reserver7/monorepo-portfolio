DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL PRIVILEGES ON TABLE
      "_prisma_migrations", "Deployment", "Issue", "LogEvent", "IssueComment", "QaScenario", "User",
      "RefreshToken", "LogAnalysisSession", "OpsAlert", "OpsReportSnapshot", "OpsSetting", "OpsAuditLog",
      "OpsNotificationDelivery", "OpsReportAction", "OpsLogSavedView", "ServiceMetricEvent",
      "EmailVerificationToken", "PasswordResetToken", "EmailChangeToken"
    FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL PRIVILEGES ON TABLE
      "_prisma_migrations", "Deployment", "Issue", "LogEvent", "IssueComment", "QaScenario", "User",
      "RefreshToken", "LogAnalysisSession", "OpsAlert", "OpsReportSnapshot", "OpsSetting", "OpsAuditLog",
      "OpsNotificationDelivery", "OpsReportAction", "OpsLogSavedView", "ServiceMetricEvent",
      "EmailVerificationToken", "PasswordResetToken", "EmailChangeToken"
    FROM authenticated;
  END IF;
END $$;
