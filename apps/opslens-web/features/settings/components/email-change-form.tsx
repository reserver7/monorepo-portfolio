"use client";

import { Box, Button, FormField, Input, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";

type EmailChangeFormProps = {
  email: string;
  pending: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
};

export function EmailChangeForm({ email, pending, onEmailChange, onSubmit }: EmailChangeFormProps) {
  const t = useTranslations("settings.profile");
  return (
    <Box className="border-default bg-surface rounded-[var(--radius-md)] border p-4">
      <Typography as="p" variant="bodySm" className="font-semibold">
        {t("emailAddress")}
      </Typography>
      <Typography as="p" variant="caption" color="muted" className="mt-1">
        {t("emailChangeDescription")}
      </Typography>
      <Box className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
        <Box className="min-w-0 flex-1">
          <FormField label={t("newEmail")} htmlFor="profile-new-email">
            <Input
              id="profile-new-email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              autoComplete="email"
            />
          </FormField>
        </Box>
        <Button type="button" loading={pending} onClick={onSubmit}>
          {t("requestEmailChange")}
        </Button>
      </Box>
    </Box>
  );
}
