"use client";

import { useEffect, useState } from "react";
import { useAppForm } from "@repo/forms";
import { useMutation } from "@repo/react-query";
import { Avatar, Badge, Box, Button, ColorPicker, FormField, Grid, Input, Typography, toast } from "@repo/ui";
import { OpsPageShell, OpsSectionCard } from "@/features";
import {
  changeCurrentPassword,
  readAuthAvatarColor,
  readAuthSession,
  setAuthAvatarColor,
  updateCurrentProfile
} from "@/lib/auth";

export default function SettingsPage() {
  const [profileName, setProfileName] = useState("User");
  const [profileEmail, setProfileEmail] = useState("-");
  const [profileRole, setProfileRole] = useState("-");
  const [profileProvider, setProfileProvider] = useState<"local" | "google" | "github">("local");
  const [avatarColor, setAvatarColor] = useState<string>("#64748B");
  const profileForm = useAppForm<{ name: string }>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: "" }
  });
  const passwordForm = useAppForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    const session = readAuthSession();
    if (!session) return;
    setProfileName(session.user.name);
    profileForm.setValue("name", session.user.name);
    setProfileEmail(session.user.email);
    setProfileRole(session.user.role);
    setProfileProvider(session.user.authProvider ?? "local");
    setAvatarColor(readAuthAvatarColor());
  }, [profileForm]);

  const profileMutation = useMutation({
    mutationFn: (values: { name: string; avatarColor?: string }) =>
      updateCurrentProfile(values),
    onSuccess: (session) => {
      setProfileName(session.user.name);
      profileForm.setValue("name", session.user.name);
      setProfileEmail(session.user.email);
      setProfileRole(session.user.role);
      setProfileProvider(session.user.authProvider ?? "local");
      setAuthAvatarColor(session.user.avatarColor ?? avatarColor);
      toast.success("프로필이 저장되었습니다.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "프로필 저장에 실패했습니다.");
    }
  });

  const submitProfile = profileForm.handleSubmit((values) => {
    profileMutation.mutate({ name: values.name.trim(), avatarColor });
  });

  const passwordMutation = useMutation({
    mutationFn: (values: { currentPassword: string; newPassword: string }) => changeCurrentPassword(values),
    onSuccess: () => {
      passwordForm.reset();
      toast.success("비밀번호가 변경되었습니다.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.");
    }
  });

  const submitPassword = passwordForm.handleSubmit((values) => {
    if (values.newPassword !== values.confirmPassword) {
      passwordForm.setError("confirmPassword", { message: "새 비밀번호 확인이 일치하지 않습니다." });
      return;
    }
    passwordMutation.mutate({
      currentPassword: values.currentPassword.trim(),
      newPassword: values.newPassword.trim()
    });
  });
  const providerLabel = profileProvider === "local" ? "Local" : profileProvider === "google" ? "Google" : "GitHub";
  const securityLabel = profileProvider === "local" ? "비밀번호 로그인" : "소셜 로그인";
  const securityTone = profileProvider === "local" ? "success" : "secondary";
  const roleLabel = profileRole ? profileRole.charAt(0).toUpperCase() + profileRole.slice(1) : "-";
  const avatarPresets = ["#3B82F6", "#64748B", "#22C55E", "#F59E0B", "#EF4444", "#A855F7"];

  return (
    <OpsPageShell>
      <OpsSectionCard
        title="Account"
        description="프로필 정보와 로그인 보안 설정을 관리합니다."
      >
        <Box className="border-default bg-surface-elevated mb-[var(--space-4)] rounded-[var(--radius-lg)] border p-[var(--space-4)]">
          <Grid className="gap-[var(--space-4)] lg:items-center">
            <Box className="flex items-center gap-[var(--space-3)]">
              <Avatar
                size="lg"
                name={profileName}
                color={avatarColor}
                status="online"
              />
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
          </Grid>
        </Box>
      </OpsSectionCard>

      <Grid className="gap-[var(--space-4)] xl:grid-cols-2">
        <OpsSectionCard
          title="프로필 편집"
          description="표시 이름을 최신 상태로 유지합니다."
        >
          <Grid className="gap-[var(--space-3)]">
            <FormField label="이름" htmlFor="profile-name">
              <Input
                id="profile-name"
                control={profileForm.control}
                name="name"
                rules={{
                  required: "이름을 입력해 주세요.",
                  minLength: { value: 2, message: "이름은 2자 이상이어야 합니다." }
                }}
                errorMessage={profileForm.formState.errors.name?.message}
                onEnter={() => submitProfile()}
              />
            </FormField>
            <FormField label="아바타 배경색" htmlFor="profile-avatar-color">
              <ColorPicker
                value={avatarColor}
                onChange={setAvatarColor}
                presets={avatarPresets}
                label="Avatar color"
              />
            </FormField>
            <Button
              variant="primary"
              className="justify-self-start"
              loading={profileMutation.isPending}
              onClick={() => submitProfile()}
            >
              변경사항 저장
            </Button>
          </Grid>
        </OpsSectionCard>

        <OpsSectionCard
          title="비밀번호 변경"
          description="로컬 로그인 계정만 비밀번호를 변경할 수 있습니다."
        >
          {profileProvider !== "local" ? (
            <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
              <Typography as="p" color="muted" className="text-body-sm leading-[1.6]">
                현재 계정은 소셜 로그인 계정입니다. 비밀번호는 소셜 제공자에서 관리됩니다.
              </Typography>
            </Box>
          ) : (
            <Grid className="gap-[var(--space-3)]">
              <FormField label="현재 비밀번호" htmlFor="profile-current-password">
                <Input
                  id="profile-current-password"
                  type="password"
                  control={passwordForm.control}
                  name="currentPassword"
                  rules={{
                    required: "현재 비밀번호를 입력해 주세요.",
                    minLength: { value: 8, message: "8자 이상 입력해 주세요." }
                  }}
                  errorMessage={passwordForm.formState.errors.currentPassword?.message}
                  onEnter={() => submitPassword()}
                />
              </FormField>
              <FormField label="새 비밀번호" htmlFor="profile-new-password">
                <Input
                  id="profile-new-password"
                  type="password"
                  control={passwordForm.control}
                  name="newPassword"
                  rules={{
                    required: "새 비밀번호를 입력해 주세요.",
                    minLength: { value: 8, message: "8자 이상 입력해 주세요." }
                  }}
                  errorMessage={passwordForm.formState.errors.newPassword?.message}
                  onEnter={() => submitPassword()}
                />
              </FormField>
              <FormField label="새 비밀번호 확인" htmlFor="profile-confirm-password">
                <Input
                  id="profile-confirm-password"
                  type="password"
                  control={passwordForm.control}
                  name="confirmPassword"
                  rules={{
                    required: "새 비밀번호 확인을 입력해 주세요."
                  }}
                  errorMessage={passwordForm.formState.errors.confirmPassword?.message}
                  onEnter={() => submitPassword()}
                />
              </FormField>
              <Button
                variant="primary"
                className="justify-self-start"
                loading={passwordMutation.isPending}
                onClick={() => submitPassword()}
              >
                비밀번호 변경
              </Button>
            </Grid>
          )}
        </OpsSectionCard>
      </Grid>
    </OpsPageShell>
  );
}
