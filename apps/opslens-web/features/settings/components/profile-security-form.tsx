"use client";

import { Box, Button, ColorPicker, FormField, Grid, Input, Typography } from "@repo/ui";
import { SETTINGS_AVATAR_COLOR_PRESETS } from "../constants";

type ProfileSecurityFormProps = {
  profileProvider: "local" | "google" | "github";
  avatarColor: string;
  profileControl: unknown;
  passwordControl: unknown;
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
  return (
    <Grid className="gap-[var(--space-4)]">
      <FormField label="이름" htmlFor="profile-name">
        <Input
          id="profile-name"
          control={profileControl}
          name="name"
          rules={{
            required: "이름을 입력해 주세요.",
            minLength: { value: 2, message: "이름은 2자 이상이어야 합니다." }
          }}
          errorMessage={profileNameError}
          onEnter={() => onSubmitProfile()}
        />
      </FormField>
      <FormField label="아바타 배경색" htmlFor="profile-avatar-color">
        <ColorPicker
          value={avatarColor}
          onChange={onAvatarColorChange}
          presets={SETTINGS_AVATAR_COLOR_PRESETS}
          label="Avatar color"
        />
      </FormField>
      {profileProvider !== "local" ? (
        <Box className="border-default bg-surface rounded-[var(--radius-md)] border p-[var(--space-3)]">
          <Typography as="p" color="muted" className="text-body-sm leading-[1.6]">
            현재 계정은 소셜 로그인 계정입니다. 비밀번호는 소셜 제공자에서 관리됩니다.
          </Typography>
        </Box>
      ) : (
        <Grid className="gap-[var(--space-3)] md:grid-cols-3">
          <FormField label="현재 비밀번호" htmlFor="profile-current-password">
            <Input
              id="profile-current-password"
              type="password"
              control={passwordControl}
              name="currentPassword"
              rules={{
                required: "현재 비밀번호를 입력해 주세요.",
                minLength: { value: 8, message: "8자 이상 입력해 주세요." }
              }}
              errorMessage={currentPasswordError}
              onEnter={() => onSubmitPassword()}
            />
          </FormField>
          <FormField label="새 비밀번호" htmlFor="profile-new-password">
            <Input
              id="profile-new-password"
              type="password"
              control={passwordControl}
              name="newPassword"
              rules={{
                required: "새 비밀번호를 입력해 주세요.",
                minLength: { value: 8, message: "8자 이상 입력해 주세요." }
              }}
              errorMessage={newPasswordError}
              onEnter={() => onSubmitPassword()}
            />
          </FormField>
          <FormField label="새 비밀번호 확인" htmlFor="profile-confirm-password">
            <Input
              id="profile-confirm-password"
              type="password"
              control={passwordControl}
              name="confirmPassword"
              rules={{
                required: "새 비밀번호 확인을 입력해 주세요."
              }}
              errorMessage={confirmPasswordError}
              onEnter={() => onSubmitPassword()}
            />
          </FormField>
        </Grid>
      )}
      <Box className="mt-[var(--space-2)] flex justify-end gap-[var(--space-2)]">
        <Button variant="primary" disabled={!canSubmit} loading={submitting} onClick={onSave}>
          변경사항 저장
        </Button>
      </Box>
    </Grid>
  );
}
