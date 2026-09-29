"use client";

import { Box, Button, Grid, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";
import type { OpsAuthSessionSummary } from "@/lib/auth";

type ActiveSessionsPanelProps = {
  sessions: OpsAuthSessionSummary[];
  loading: boolean;
  pendingSessionId?: string;
  revokingAll: boolean;
  onRevoke: (session: OpsAuthSessionSummary) => void;
  onRevokeAll: () => void;
};

const formatDate = (value: string): string => new Date(value).toLocaleString();

export function ActiveSessionsPanel({
  sessions,
  loading,
  pendingSessionId,
  revokingAll,
  onRevoke,
  onRevokeAll
}: ActiveSessionsPanelProps) {
  const t = useTranslations("settings.screen");

  return (
    <Grid className="gap-[var(--space-3)]">
      <Box className="flex items-center justify-between gap-3">
        <Typography as="p" variant="bodySm" color="muted">
          {loading ? t("sessionsLoading") : t("sessionsCount", { count: sessions.length })}
        </Typography>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={sessions.length === 0}
          loading={revokingAll}
          onClick={onRevokeAll}
        >
          {t("logoutAllSessions")}
        </Button>
      </Box>
      {sessions.length === 0 && !loading ? (
        <Typography as="p" variant="bodySm" color="muted">
          {t("noActiveSessions")}
        </Typography>
      ) : (
        sessions.map((session) => (
          <Box
            key={session.id}
            className="border-default bg-surface flex items-center justify-between gap-3 rounded-[var(--radius-md)] border p-[var(--space-3)]"
          >
            <Box className="min-w-0">
              <Typography as="p" variant="bodySm" className="font-semibold">
                {session.isCurrent ? t("currentSession") : session.userAgent || t("unknownDevice")}
              </Typography>
              <Typography as="p" variant="caption" color="muted">
                {session.ipAddress || t("unknownIp")} ·{" "}
                {t("lastUsedAt", { date: formatDate(session.lastUsedAt ?? session.createdAt) })}
              </Typography>
            </Box>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={session.isCurrent}
              loading={pendingSessionId === session.id}
              onClick={() => onRevoke(session)}
            >
              {t("logoutSession")}
            </Button>
          </Box>
        ))
      )}
    </Grid>
  );
}
