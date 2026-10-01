"use client";

import { Box, Button, ColorPicker, FormField, Grid, Input, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PasswordStrength } from "@/features/auth/components/password-strength";
import { SETTINGS_AVATAR_COLOR_PRESETS } from "../constants";

type ProfileSecurityFormProps = {
  profileProvider: "local" | "google" | "github";
  avatarColor: string;
  profileControl: unknown;
  passwordControl: unknown;
  newPasswordValue: string;
  profileNameError?: string;
  currentPasswordError?: string;
  newPasswordError?: string;
  confirmPasswordError?: string;
  canSubmit: boolean;
  submitting: boolean;
  onAvatarColorChange: (value: string) => void;
  onSubmitProfile: () => void;
  onSubmitPassword: () => void;
  onSave: () => void;
};

export function ProfileSecurityForm({
  profileProvider,
  avatarColor,
  profileControl,
  passwordControl,
  newPasswordValue,
  profileNameError,
  currentPasswordError,
  newPasswordError,
  confirmPasswordError,
  canSubmit,
  submitting,
  onAvatarColorChange,
  onSubmitProfile,
  onSubmitPassword,
  onSave
}: ProfileSecurityFormProps) {
  const t = useTranslations("settings.profile");
  const tAuth = useTranslations("auth");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  return (
    <Grid className="gap-[var(--space-4)]">
      <FormField label={t("name")} htmlFor="profile-name">
        <Input
          id="profile-name"
          control={profileControl}
          name="name"
          rules={{
            required: t("nameRequired"),
            minLength: { value: 2, message: t("nameMin") }
          }}
          errorMessage={profileNameError}
          onEnter={() => onSubmitProfile()}
        />
      </FormField>
      <FormField label={t("avatarColor")} htmlFor="profile-avatar-color">
        <ColorPicker
          value={avatarColor}
          onChange={onAvatarColorChange}
          presets={SETTINGS_AVATAR_COLOR_PRESETS}
          label={t("avatarColor")}
        />
      </FormField>
      {profileProvider !== "local" ? (
        <Box className="border-default bg-surface rounded-[var(--radius-md)] border p-[var(--space-3)]">
          <Typography as="p" color="muted" className="text-body-sm leading-[1.6]">
            {t("socialPassword")}
          </Typography>
        </Box>
      ) : (
        <Grid className="gap-[var(--space-3)] md:grid-cols-3">
          <FormField label={t("currentPassword")} htmlFor="profile-current-password">
            <Box className="flex items-end gap-2">
              <Input
                id="profile-current-password"
                type={showCurrentPassword ? "text" : "password"}
                control={passwordControl}
                name="currentPassword"
                rules={{
                  required: t("currentPasswordRequired"),
                  minLength: { value: 8, message: t("passwordMin") }
                }}
                errorMessage={currentPasswordError}
                onEnter={() => onSubmitPassword()}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCurrentPassword((value) => !value)}
              >
                {showCurrentPassword ? tAuth("hidePassword") : tAuth("showPassword")}
              </Button>
            </Box>
          </FormField>
          <FormField label={t("newPassword")} htmlFor="profile-new-password">
            <Box>
              <Box className="flex items-end gap-2">
                <Input
                  id="profile-new-password"
                  type={showNewPassword ? "text" : "password"}
                  control={passwordControl}
                  name="newPassword"
                  rules={{
                    required: t("newPasswordRequired"),
                    minLength: { value: 8, message: t("passwordMin") }
                  }}
                  errorMessage={newPasswordError}
                  onEnter={() => onSubmitPassword()}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewPassword((value) => !value)}
                >
                  {showNewPassword ? tAuth("hidePassword") : tAuth("showPassword")}
                </Button>
              </Box>
              <PasswordStrength password={newPasswordValue} />
            </Box>
          </FormField>
          <FormField label={t("confirmPassword")} htmlFor="profile-confirm-password">
            <Box className="flex items-end gap-2">
              <Input
                id="profile-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                control={passwordControl}
                name="confirmPassword"
                rules={{
                  required: t("confirmPasswordRequired")
                }}
                errorMessage={confirmPasswordError}
                onEnter={() => onSubmitPassword()}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmPassword((value) => !value)}
              >
                {showConfirmPassword ? tAuth("hidePassword") : tAuth("showPassword")}
              </Button>
            </Box>
          </FormField>
        </Grid>
      )}
      <Box className="mt-[var(--space-2)] flex justify-end gap-[var(--space-2)]">
        <Button variant="primary" disabled={!canSubmit} loading={submitting} onClick={onSave}>
          {t("save")}
        </Button>
      </Box>
    </Grid>
  );
}
