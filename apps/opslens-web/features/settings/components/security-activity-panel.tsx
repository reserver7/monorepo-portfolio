"use client";

import { Badge, Box, Grid, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";
import type { OpsSecurityActivity } from "@/lib/auth";
import { AUDIT_SEVERITY_TONE, formatAuditListDateTime } from "../utils/settings-utils";

type SecurityActivityPanelProps = {
  activities: OpsSecurityActivity[];
  loading: boolean;
};

export function SecurityActivityPanel({ activities, loading }: SecurityActivityPanelProps) {
  const t = useTranslations("settings.screen");

  return (
    <Grid className="gap-2">
      {loading ? (
        <Typography as="p" variant="bodySm" color="muted">
          {t("securityActivityLoading")}
        </Typography>
      ) : activities.length === 0 ? (
        <Typography as="p" variant="bodySm" color="muted">
          {t("noSecurityActivity")}
        </Typography>
      ) : (
        activities.map((activity) => {
          const actionLabel =
            {
              "auth.login": t("securityActions.login"),
              "auth.login_failed": t("securityActions.loginFailed"),
              "auth.email_verified": t("securityActions.emailVerified"),
              "auth.verification_resent": t("securityActions.verificationResent"),
              "auth.password_reset_requested": t("securityActions.passwordResetRequested"),
              "auth.password_reset": t("securityActions.passwordReset"),
              "auth.password_changed": t("securityActions.passwordChanged"),
              "auth.logout": t("securityActions.logout"),
              "auth.session_revoked": t("securityActions.sessionRevoked"),
              "auth.sessions_revoked": t("securityActions.sessionsRevoked")
            }[activity.action] ?? activity.summary;
          return (
            <Box
              key={activity.id}
              className="border-default flex items-center justify-between gap-3 rounded-[var(--radius-md)] border p-3"
            >
              <Box className="min-w-0">
                <Typography as="p" variant="bodySm" className="font-semibold">
                  {actionLabel}
                </Typography>
                <Typography as="p" variant="caption" color="muted" className="mt-1 truncate">
                  {activity.metadata && activity.metadata !== "{}" ? activity.metadata : activity.summary}
                </Typography>
              </Box>
              <Box className="flex shrink-0 items-center gap-2">
                <Badge variant={AUDIT_SEVERITY_TONE[activity.severity] ?? "secondary"} size="sm">
                  {activity.severity}
                </Badge>
                <Typography as="span" variant="caption" color="subtle">
                  {formatAuditListDateTime(activity.createdAt)}
                </Typography>
              </Box>
            </Box>
          );
        })
      )}
    </Grid>
  );
}
