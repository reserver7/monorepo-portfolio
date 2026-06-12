"use client";

import { Avatar, Badge, Box, Button, Grid, Typography } from "@repo/ui";

type AccountSummaryCardProps = {
  profileName: string;
  profileEmail: string;
  roleLabel: string;
  providerLabel: string;
  securityLabel: string;
  securityTone: "success" | "secondary";
  avatarColor: string;
  sessionTypeLabel: string;
  sessionExpiresLabel: string;
  logoutPending: boolean;
  onLogoutCurrentSession: () => void;
};

export function AccountSummaryCard({
  profileName,
  profileEmail,
  roleLabel,
  providerLabel,
  securityLabel,
  securityTone,
  avatarColor,
  sessionTypeLabel,
  sessionExpiresLabel,
  logoutPending,
  onLogoutCurrentSession
}: AccountSummaryCardProps) {
  return (
    <Box className="border-default bg-surface mb-[var(--space-4)] rounded-[var(--radius-lg)] border p-[var(--space-4)]">
      <Grid className="gap-[var(--space-4)] lg:items-center">
        <Box className="flex items-center gap-[var(--space-3)]">
          <Avatar size="lg" name={profileName} color={avatarColor} status="online" />
          <Grid className="min-w-0 gap-[var(--space-1)]">
            <Typography as="p" className="text-foreground truncate text-body-lg font-semibold">{profileName}</Typography>
            <Typography as="p" color="muted" className="truncate text-body-sm">{profileEmail}</Typography>
            <Box className="flex flex-wrap items-center gap-[var(--space-2)]">
              <Badge variant="secondary" size="sm">{roleLabel}</Badge>
              <Badge variant="outline" size="sm">{providerLabel}</Badge>
              <Badge variant={securityTone} size="sm">{securityLabel}</Badge>
            </Box>
          </Grid>
        </Box>
        <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
          <Grid className="gap-[var(--space-2)]">
            <Box className="flex items-center justify-between gap-[var(--space-2)]">
              <Typography as="p" color="muted" className="text-body-sm">세션 타입</Typography>
              <Badge variant="secondary" size="sm">{sessionTypeLabel}</Badge>
            </Box>
            <Box className="flex items-center justify-between gap-[var(--space-2)]">
              <Typography as="p" color="muted" className="text-body-sm">만료 시각</Typography>
              <Typography as="p" className="text-body-sm font-medium">{sessionExpiresLabel}</Typography>
            </Box>
            <Box className="mt-[var(--space-2)] flex justify-end">
              <Button variant="secondary" loading={logoutPending} onClick={onLogoutCurrentSession}>
                현재 세션 로그아웃
              </Button>
            </Box>
          </Grid>
        </Box>
      </Grid>
    </Box>
  );
}
