"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { useMutation } from "@repo/react-query";
import { Avatar, Badge, Box, Button, ColorPicker, FormField, Grid, Input, Select, Switch, TimePicker, Typography, toast, type TimeRangeValue } from "@repo/ui";
import { OpsPageShell, OpsSectionCard } from "@/features";
import {
  changeCurrentPassword,
  clearAuthSession,
  fetchNotificationPolicy,
  logoutCurrentSession,
  readNotificationPolicy,
  readAuthAvatarColor,
  readAuthSession,
  updateNotificationPolicy,
  type OpsNotificationPolicy,
  setAuthAvatarColor,
  updateCurrentProfile
} from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [profileName, setProfileName] = useState("User");
  const [profileEmail, setProfileEmail] = useState("-");
  const [profileRole, setProfileRole] = useState("-");
  const [profileProvider, setProfileProvider] = useState<"local" | "google" | "github">("local");
  const [avatarColor, setAvatarColor] = useState<string>("#64748B");
  const [initialAvatarColor, setInitialAvatarColor] = useState<string>("#64748B");
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [notificationPolicy, setNotificationPolicy] = useState<OpsNotificationPolicy>(() => readNotificationPolicy());
  const [initialNotificationPolicy, setInitialNotificationPolicy] = useState<OpsNotificationPolicy>(() => readNotificationPolicy());
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
    const savedAvatarColor = readAuthAvatarColor();
    setAvatarColor(savedAvatarColor);
    setInitialAvatarColor(savedAvatarColor);
    setSessionExpiresAt(session.expiresAt);
    setNotificationPolicy(readNotificationPolicy());
    void fetchNotificationPolicy()
      .then((policy) => {
        setNotificationPolicy(policy);
        setInitialNotificationPolicy(policy);
      })
      .catch(() => undefined);
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
      const nextAvatarColor = session.user.avatarColor ?? avatarColor;
      setAuthAvatarColor(nextAvatarColor);
      setInitialAvatarColor(nextAvatarColor);
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
  const sessionTypeLabel = useMemo(() => {
    if (typeof window === "undefined") return "Persistent";
    return window.sessionStorage.getItem("opslens.auth.access-token") ? "Session" : "Persistent";
  }, []);
  const sessionExpiresLabel = sessionExpiresAt
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(sessionExpiresAt))
    : "-";
  const inAppOptions = [
    { label: "모든 알림", value: "all" },
    { label: "High 이상", value: "high" },
    { label: "Critical만", value: "critical" }
  ] as const;

  const saveNotificationMutation = useMutation({
    mutationFn: async () => updateNotificationPolicy(notificationPolicy),
    onSuccess: () => {
      setInitialNotificationPolicy(notificationPolicy);
      toast.success("알림 정책이 저장되었습니다.");
    },
    onError: () => {
      toast.error("알림 정책 저장에 실패했습니다.");
    }
  });

  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      await logoutCurrentSession();
      clearAuthSession();
    },
    onSuccess: () => {
      toast.success("현재 세션이 종료되었습니다.");
      router.replace("/login");
    },
    onError: () => {
      toast.error("세션 종료에 실패했습니다.");
    }
  });

  const isProfileDirty =
    profileForm.getValues("name").trim() !== profileName ||
    avatarColor !== initialAvatarColor;
  const isPasswordDirty =
    passwordForm.formState.isDirty ||
    Boolean(passwordForm.getValues("currentPassword")) ||
    Boolean(passwordForm.getValues("newPassword")) ||
    Boolean(passwordForm.getValues("confirmPassword"));
  const isNotificationDirty =
    notificationPolicy.inAppEnabled !== initialNotificationPolicy.inAppEnabled ||
    notificationPolicy.emailEnabled !== initialNotificationPolicy.emailEnabled ||
    notificationPolicy.slackEnabled !== initialNotificationPolicy.slackEnabled ||
    notificationPolicy.minLevel !== initialNotificationPolicy.minLevel ||
    notificationPolicy.quietHoursEnabled !== initialNotificationPolicy.quietHoursEnabled ||
    notificationPolicy.quietFrom !== initialNotificationPolicy.quietFrom ||
    notificationPolicy.quietTo !== initialNotificationPolicy.quietTo;
  const canSubmitProfileSecurity = isProfileDirty || (profileProvider === "local" && isPasswordDirty);
  const isProfileSecuritySubmitting = profileMutation.isPending || passwordMutation.isPending;
  const handleSaveProfileSecurity = async () => {
    const tasks: Array<Promise<unknown>> = [];
    if (isProfileDirty) {
      tasks.push(profileMutation.mutateAsync({ name: profileForm.getValues("name").trim(), avatarColor }));
    }
    if (profileProvider === "local" && isPasswordDirty) {
      const values = passwordForm.getValues();
      if (values.newPassword !== values.confirmPassword) {
        passwordForm.setError("confirmPassword", { message: "새 비밀번호 확인이 일치하지 않습니다." });
        return;
      }
      tasks.push(
        passwordMutation.mutateAsync({
          currentPassword: values.currentPassword.trim(),
          newPassword: values.newPassword.trim()
        })
      );
    }
    if (tasks.length === 0) return;
    try {
      await Promise.all(tasks);
      toast.success("변경사항이 저장되었습니다.");
    } catch {
      // Individual mutation onError handlers already surface error toasts.
    }
  };

  return (
    <OpsPageShell>
      <OpsSectionCard
        title="Account"
        description="프로필, 세션 상태, 계정 보안을 관리합니다."
      >
        <Box className="border-default bg-surface mb-[var(--space-4)] rounded-[var(--radius-lg)] border p-[var(--space-4)]">
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
                  <Button
                    variant="secondary"
                    loading={logoutAllMutation.isPending}
                    onClick={() => logoutAllMutation.mutate()}
                  >
                    현재 세션 로그아웃
                  </Button>
                </Box>
              </Grid>
            </Box>
          </Grid>
        </Box>
      </OpsSectionCard>

      <OpsSectionCard
        title="프로필 및 비밀번호"
        description="프로필 정보와 비밀번호를 한 번에 관리합니다."
      >
          <Grid className="gap-[var(--space-4)]">
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
              </Grid>
            )}
            <Box className="mt-[var(--space-2)] flex justify-end gap-[var(--space-2)]">
              <Button
                variant="primary"
                disabled={!canSubmitProfileSecurity}
                loading={isProfileSecuritySubmitting}
                onClick={handleSaveProfileSecurity}
              >
                변경사항 저장
              </Button>
            </Box>
          </Grid>
      </OpsSectionCard>

      <OpsSectionCard
        title="알림 정책"
        description="인앱 알림 노출 기준과 조용한 시간대를 설정합니다."
      >
          <Grid className="gap-[var(--space-3)]">
            <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
              <Grid className="gap-[var(--space-3)]">
                <Typography as="p" className="text-body-sm font-semibold">채널</Typography>
                <Box className={notificationPolicy.inAppEnabled ? "border-default flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]" : "border-default bg-surface-elevated/70 flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]"}>
                  <Box className="grid gap-[2px]">
                    <Typography as="p" className="text-body-sm">인앱 알림</Typography>
                    <Typography as="p" color="muted" className="text-caption">대시보드/화면 내 알림을 표시합니다.</Typography>
                  </Box>
                  <Box className="flex items-center gap-[var(--space-2)]">
                    <Badge variant={notificationPolicy.inAppEnabled ? "success" : "secondary"} size="sm">
                      {notificationPolicy.inAppEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={notificationPolicy.inAppEnabled}
                      color={notificationPolicy.inAppEnabled ? "primary" : "warning"}
                      onCheckedChange={(checked) =>
                        setNotificationPolicy((prev) => ({ ...prev, inAppEnabled: checked }))
                      }
                    />
                  </Box>
                </Box>
                <Box className={notificationPolicy.emailEnabled ? "border-default flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]" : "border-default bg-surface-elevated/70 flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]"}>
                  <Box className="grid gap-[2px]">
                    <Typography as="p" className="text-body-sm">이메일 알림</Typography>
                    <Typography as="p" color="muted" className="text-caption">중요 이벤트를 이메일로 발송합니다.</Typography>
                  </Box>
                  <Box className="flex items-center gap-[var(--space-2)]">
                    <Badge variant={notificationPolicy.emailEnabled ? "success" : "secondary"} size="sm">
                      {notificationPolicy.emailEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={notificationPolicy.emailEnabled}
                      color={notificationPolicy.emailEnabled ? "primary" : "warning"}
                      onCheckedChange={(checked) =>
                        setNotificationPolicy((prev) => ({ ...prev, emailEnabled: checked }))
                      }
                    />
                  </Box>
                </Box>
                <Box className={notificationPolicy.slackEnabled ? "border-default flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]" : "border-default bg-surface-elevated/70 flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]"}>
                  <Box className="grid gap-[2px]">
                    <Typography as="p" className="text-body-sm">슬랙 알림</Typography>
                    <Typography as="p" color="muted" className="text-caption">운영 채널로 즉시 전파합니다.</Typography>
                  </Box>
                  <Box className="flex items-center gap-[var(--space-2)]">
                    <Badge variant={notificationPolicy.slackEnabled ? "success" : "secondary"} size="sm">
                      {notificationPolicy.slackEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={notificationPolicy.slackEnabled}
                      color={notificationPolicy.slackEnabled ? "primary" : "warning"}
                      onCheckedChange={(checked) =>
                        setNotificationPolicy((prev) => ({ ...prev, slackEnabled: checked }))
                      }
                    />
                  </Box>
                </Box>
              </Grid>
            </Box>

            <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
              <Grid className="gap-[var(--space-3)]">
                <Typography as="p" className="text-body-sm font-semibold">노출 기준</Typography>
                <FormField label="최소 알림 레벨" htmlFor="notification-min-level">
                  <Select
                    value={notificationPolicy.minLevel}
                    onChange={(next) =>
                      setNotificationPolicy((prev) => ({
                        ...prev,
                        minLevel: next === "all" || next === "high" || next === "critical" ? next : "all"
                      }))
                    }
                    options={[...inAppOptions]}
                  />
                </FormField>
              </Grid>
            </Box>

            <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
              <Grid className="gap-[var(--space-3)]">
                <Box className={notificationPolicy.quietHoursEnabled ? "border-default flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]" : "border-default bg-surface-elevated/70 flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]"}>
                  <Box className="grid gap-[2px]">
                    <Typography as="p" className="text-body-sm font-semibold">방해금지 시간</Typography>
                    <Typography as="p" color="muted" className="text-caption">지정한 시간에는 알림을 억제합니다.</Typography>
                  </Box>
                  <Box className="flex items-center gap-[var(--space-2)]">
                    <Badge variant={notificationPolicy.quietHoursEnabled ? "success" : "secondary"} size="sm">
                      {notificationPolicy.quietHoursEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={notificationPolicy.quietHoursEnabled}
                      color={notificationPolicy.quietHoursEnabled ? "primary" : "warning"}
                      onCheckedChange={(checked) =>
                        setNotificationPolicy((prev) => ({ ...prev, quietHoursEnabled: checked }))
                      }
                    />
                  </Box>
                </Box>

                {notificationPolicy.quietHoursEnabled ? (
                  <FormField label="조용한 시간대" htmlFor="notification-quiet-range">
                    <TimePicker.RangePicker
                      minuteStep={5}
                      value={{ start: notificationPolicy.quietFrom, end: notificationPolicy.quietTo }}
                      startPlaceholder="시작 시간"
                      endPlaceholder="종료 시간"
                      disabledTime={(value: TimeRangeValue, type: "start" | "end") => {
                        const parseMinutes = (text?: string) => {
                          if (!text) return null;
                          const [hourRaw, minuteRaw] = text.split(":");
                          const hour = Number(hourRaw);
                          const minute = Number(minuteRaw);
                          if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
                          return hour * 60 + minute;
                        };
                        const startMinute = parseMinutes(value.start);
                        const endMinute = parseMinutes(value.end);
                        if (startMinute == null || endMinute == null || startMinute !== endMinute) return {};
                        const blockedHour = Math.floor(startMinute / 60);
                        const blockedMinute = startMinute % 60;
                        if (type === "start") {
                          return {
                            disabledHours: () => [blockedHour],
                            disabledMinutes: (selectedHour: number) => (selectedHour === blockedHour ? [blockedMinute] : [])
                          };
                        }
                        return {
                          disabledHours: () => [blockedHour],
                          disabledMinutes: (selectedHour: number) => (selectedHour === blockedHour ? [blockedMinute] : [])
                        };
                      }}
                      onValueChange={(nextValue: TimeRangeValue) =>
                        setNotificationPolicy((prev) => ({
                          ...prev,
                          quietFrom: nextValue.start || "22:00",
                          quietTo: nextValue.end || "08:00"
                        }))
                      }
                    />
                  </FormField>
                ) : (
                  <Typography as="p" color="muted" className="text-caption">
                    방해금지 시간이 비활성화되어 있습니다.
                  </Typography>
                )}
              </Grid>
            </Box>
            <Box className="mt-[var(--space-2)] flex justify-end">
              <Button
                variant="primary"
                disabled={!isNotificationDirty}
                loading={saveNotificationMutation.isPending}
                onClick={() => saveNotificationMutation.mutate()}
              >
                알림 정책 저장
              </Button>
            </Box>
          </Grid>
      </OpsSectionCard>
    </OpsPageShell>
  );
}
