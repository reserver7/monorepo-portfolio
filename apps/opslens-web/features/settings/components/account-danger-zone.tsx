"use client";

import { Box, Button, FormField, Input, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";

type AccountDangerZoneProps = {
  email: string;
  currentPassword: string;
  confirmation: string;
  pending: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  onDelete: () => void;
};

export function AccountDangerZone({
  email,
  currentPassword,
  confirmation,
  pending,
  onPasswordChange,
  onConfirmationChange,
  onDelete
}: AccountDangerZoneProps) {
  const t = useTranslations("settings.screen");

  return (
    <Box className="border-danger bg-surface rounded-[var(--radius-md)] border p-4">
      <Typography as="h3" variant="headingMd">
        {t("deleteAccountTitle")}
      </Typography>
      <Typography as="p" variant="bodySm" color="muted" className="mt-1">
        {t("deleteAccountDescription")}
      </Typography>
      <Box className="mt-4 grid gap-3 md:grid-cols-2">
        <FormField label={t("deleteAccountPassword")} htmlFor="delete-account-password">
          <Input
            id="delete-account-password"
            type="password"
            value={currentPassword}
            onChange={(event) => onPasswordChange(event.target.value)}
            autoComplete="current-password"
          />
        </FormField>
        <FormField label={t("deleteAccountConfirmation")} htmlFor="delete-account-confirmation">
          <Input
            id="delete-account-confirmation"
            value={confirmation}
            onChange={(event) => onConfirmationChange(event.target.value)}
            placeholder={email}
            autoComplete="off"
          />
        </FormField>
      </Box>
      <Button
        className="mt-4"
        type="button"
        variant="danger"
        loading={pending}
        disabled={confirmation !== email || currentPassword.length < 8}
        onClick={onDelete}
      >
        {t("deleteAccount")}
      </Button>
    </Box>
  );
}
