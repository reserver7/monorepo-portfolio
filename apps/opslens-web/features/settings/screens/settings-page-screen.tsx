"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { getOpsAuditLogs, getOpsSettings, opslensQueryKeys, upsertOpsSetting, type OpsAuditLog, type OpsSetting } from "@repo/opslens";
import { Avatar, Badge, Box, Button, ColorPicker, Flex, FormField, Grid, Input, Select, Switch, Textarea, TimePicker, Typography, toast, type TimeRangeValue } from "@repo/ui";
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
import {
  SETTINGS_AVATAR_COLOR_PRESETS,
  SETTINGS_DEFAULT_AVATAR_COLOR,
  SETTINGS_IN_APP_NOTIFICATION_LEVEL_OPTIONS
} from "../constants";
import type { PasswordFormValues, ProfileFormValues } from "../types";

const SETTING_RISK_TONE = {
  low: "secondary",
  medium: "info",
  high: "warning",
  critical: "danger"
} as const;

const AUDIT_SEVERITY_TONE = {
  info: "secondary",
  warning: "warning",
  critical: "danger"
} as const;

const parseJsonLabel = (value?: string | null) => {
  if (!value) return "";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const profileSectionRef = useRef<HTMLDivElement | null>(null);
  const workspaceSectionRef = useRef<HTMLDivElement | null>(null);
  const notificationSectionRef = useRef<HTMLDivElement | null>(null);
  const auditSectionRef = useRef<HTMLDivElement | null>(null);
  const [profileName, setProfileName] = useState("User");
  const [profileEmail, setProfileEmail] = useState("-");
  const [profileRole, setProfileRole] = useState("-");
  const [profileProvider, setProfileProvider] = useState<"local" | "google" | "github">("local");
  const [avatarColor, setAvatarColor] = useState<string>(SETTINGS_DEFAULT_AVATAR_COLOR);
  const [initialAvatarColor, setInitialAvatarColor] = useState<string>(SETTINGS_DEFAULT_AVATAR_COLOR);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [notificationPolicy, setNotificationPolicy] = useState<OpsNotificationPolicy>(() => readNotificationPolicy());
  const [initialNotificationPolicy, setInitialNotificationPolicy] = useState<OpsNotificationPolicy>(() => readNotificationPolicy());
  const [selectedSettingKey, setSelectedSettingKey] = useState("");
  const [settingValueDraft, setSettingValueDraft] = useState("");
  const [settingReasonDraft, setSettingReasonDraft] = useState("");
  const [auditQuery, setAuditQuery] = useState("");
  const [auditSeverity, setAuditSeverity] = useState("all");
  const [auditTargetType, setAuditTargetType] = useState("all");
  const [selectedAuditId, setSelectedAuditId] = useState("");
  const profileForm = useAppForm<ProfileFormValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: "" }
  });
  const passwordForm = useAppForm<PasswordFormValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const opsSettingsQuery = useQuery({
    queryKey: opslensQueryKeys.settings(),
    queryFn: getOpsSettings,
    staleTime: 30_000
  });
  const auditLogsQuery = useQuery({
    queryKey: [...opslensQueryKeys.auditLogs(), auditQuery, auditSeverity, auditTargetType],
    queryFn: () =>
      getOpsAuditLogs({
        query: auditQuery.trim() || undefined,
        severity: auditSeverity === "all" ? undefined : auditSeverity,
        targetType: auditTargetType === "all" ? undefined : auditTargetType,
        limit: 100
      }),
    staleTime: 15_000
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

  const settings = opsSettingsQuery.data ?? [];
  const auditLogs = auditLogsQuery.data ?? [];
  const selectedSetting = settings.find((setting) => setting.key === selectedSettingKey) ?? settings[0];
  const selectedAuditLog = auditLogs.find((log) => log.id === selectedAuditId) ?? auditLogs[0];

  useEffect(() => {
    if (!selectedSetting) return;
    setSelectedSettingKey((current) => current || selectedSetting.key);
    setSettingValueDraft(parseJsonLabel(selectedSetting.value));
    setSettingReasonDraft("");
  }, [selectedSetting?.key, selectedSetting?.value]);

  useEffect(() => {
    if (!selectedAuditLog) return;
    setSelectedAuditId((current) => current || selectedAuditLog.id);
  }, [selectedAuditLog?.id]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const target =
      tab === "profile"
        ? profileSectionRef.current
        : tab === "workspace"
          ? workspaceSectionRef.current
          : tab === "notifications"
            ? notificationSectionRef.current
            : tab === "audit"
              ? auditSectionRef.current
              : null;

    target?.scrollIntoView({ block: "start" });
  }, [searchParams]);

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

  const selectedSettingChanged =
    Boolean(selectedSetting) &&
    (settingValueDraft.trim() !== parseJsonLabel(selectedSetting?.value).trim() ||
      settingReasonDraft.trim().length > 0);

  const saveOpsSettingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSetting) throw new Error("저장할 운영 설정을 선택하세요.");
      try {
        JSON.parse(settingValueDraft);
      } catch {
        throw new Error("설정 값은 올바른 JSON 형식이어야 합니다.");
      }
      return upsertOpsSetting({
        key: selectedSetting.key,
        value: settingValueDraft,
        description: selectedSetting.description ?? undefined,
        category: selectedSetting.category,
        riskLevel: selectedSetting.riskLevel,
        editable: selectedSetting.editable,
        updatedBy: profileEmail || "operator",
        changeReason: settingReasonDraft.trim() || "운영 설정 변경"
      });
    },
    onSuccess: async () => {
      setSettingReasonDraft("");
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.auditLogs() });
      toast.success("운영 설정이 저장되었습니다.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "운영 설정 저장에 실패했습니다.");
    }
  });

  const saveNotificationMutation = useMutation({
    mutationFn: async () => {
      const saved = await updateNotificationPolicy(notificationPolicy);
      await upsertOpsSetting({
        key: "alert.policy",
        value: JSON.stringify({
          inAppEnabled: saved.inAppEnabled,
          emailEnabled: saved.emailEnabled,
          slackEnabled: saved.slackEnabled,
          minLevel: saved.minLevel,
          quietHoursEnabled: saved.quietHoursEnabled,
          quietFrom: saved.quietFrom,
          quietTo: saved.quietTo
        }),
        description: "운영 알림 발송 및 화면 노출 정책",
        updatedBy: profileEmail || "operator"
      });
      return saved;
    },
    onSuccess: () => {
      setInitialNotificationPolicy(notificationPolicy);
      void queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() });
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
      <Box>
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
      </Box>

      <Box ref={profileSectionRef}>
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
      </Box>

      <Box ref={workspaceSectionRef}>
        <OpsSectionCard
          title="운영 설정"
          description="운영 정책을 검토하고 변경 사유와 함께 저장합니다."
        >
          {opsSettingsQuery.isError ? (
            <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
              <Typography as="p" color="muted" className="text-body-sm">
                운영 설정을 불러오지 못했습니다.
              </Typography>
            </Box>
          ) : (
            <Grid className="gap-[var(--space-4)] xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.35fr)]">
              <Grid className="content-start gap-[var(--space-2)]">
                {settings.map((setting: OpsSetting) => {
                  const selected = selectedSetting?.key === setting.key;
                  return (
                    <Button
                      key={setting.id}
                      variant={selected ? "primary" : "secondary"}
                      className="h-auto justify-start rounded-[var(--radius-md)] p-[var(--space-3)] text-left"
                      onClick={() => {
                        setSelectedSettingKey(setting.key);
                        setSettingValueDraft(parseJsonLabel(setting.value));
                        setSettingReasonDraft("");
                      }}
                    >
                      <Box className="grid w-full gap-[var(--space-2)]">
                        <Flex className="items-start justify-between gap-[var(--space-2)]">
                          <Typography as="span" className="truncate text-body-sm font-semibold">
                            {setting.key}
                          </Typography>
                          <Badge
                            variant={SETTING_RISK_TONE[setting.riskLevel as keyof typeof SETTING_RISK_TONE] ?? "secondary"}
                            size="sm"
                          >
                            {setting.riskLevel}
                          </Badge>
                        </Flex>
                        <Flex className="flex-wrap gap-[var(--space-1)]">
                          <Badge variant="outline" size="sm">{setting.category}</Badge>
                          <Badge variant={setting.editable ? "success" : "secondary"} size="sm">
                            {setting.editable ? "편집 가능" : "읽기 전용"}
                          </Badge>
                        </Flex>
                        {setting.description ? (
                          <Typography as="span" color="muted" className="line-clamp-2 text-caption leading-[1.5]">
                            {setting.description}
                          </Typography>
                        ) : null}
                      </Box>
                    </Button>
                  );
                })}
              </Grid>

              <Box className="border-default bg-surface rounded-[var(--radius-lg)] border p-[var(--space-4)]">
                {selectedSetting ? (
                  <Grid className="gap-[var(--space-4)]">
                    <Flex className="items-start justify-between gap-[var(--space-3)]">
                      <Box className="min-w-0">
                        <Typography as="h3" className="truncate text-body-lg font-semibold">
                          {selectedSetting.key}
                        </Typography>
                        <Typography as="p" color="muted" className="mt-[var(--space-1)] text-body-sm">
                          {selectedSetting.description ?? "설명 없음"}
                        </Typography>
                      </Box>
                      <Flex className="shrink-0 flex-wrap justify-end gap-[var(--space-1)]">
                        <Badge variant="outline" size="sm">{selectedSetting.category}</Badge>
                        <Badge
                          variant={SETTING_RISK_TONE[selectedSetting.riskLevel as keyof typeof SETTING_RISK_TONE] ?? "secondary"}
                          size="sm"
                        >
                          {selectedSetting.riskLevel}
                        </Badge>
                      </Flex>
                    </Flex>

                    <Grid className="gap-[var(--space-3)] md:grid-cols-2">
                      <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                        <Typography as="p" color="muted" className="text-caption">마지막 수정자</Typography>
                        <Typography as="p" className="mt-[var(--space-1)] text-body-sm font-semibold">
                          {selectedSetting.updatedBy}
                        </Typography>
                      </Box>
                      <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                        <Typography as="p" color="muted" className="text-caption">마지막 변경 사유</Typography>
                        <Typography as="p" className="mt-[var(--space-1)] text-body-sm font-semibold">
                          {selectedSetting.changeReason ?? "기록 없음"}
                        </Typography>
                      </Box>
                    </Grid>

                    <Textarea
                      label="설정 값(JSON)"
                      value={settingValueDraft}
                      rows={10}
                      resize="vertical"
                      disabled={!selectedSetting.editable}
                      className="font-mono text-[12px] leading-[1.55]"
                      onChange={(event) => setSettingValueDraft(event.target.value)}
                    />
                    <Input
                      label="변경 사유"
                      value={settingReasonDraft}
                      disabled={!selectedSetting.editable}
                      placeholder="예: critical 알림의 슬랙 전파 기준 강화"
                      onChange={(event) => setSettingReasonDraft(event.target.value)}
                    />
                    <Flex className="justify-end gap-[var(--space-2)]">
                      <Button
                        variant="secondary"
                        disabled={!selectedSettingChanged}
                        onClick={() => {
                          setSettingValueDraft(parseJsonLabel(selectedSetting.value));
                          setSettingReasonDraft("");
                        }}
                      >
                        되돌리기
                      </Button>
                      <Button
                        variant="primary"
                        disabled={!selectedSetting.editable || !selectedSettingChanged || settingReasonDraft.trim().length === 0}
                        loading={saveOpsSettingMutation.isPending}
                        onClick={() => saveOpsSettingMutation.mutate()}
                      >
                        설정 저장
                      </Button>
                    </Flex>
                  </Grid>
                ) : (
                  <Typography as="p" color="muted" className="text-body-sm">
                    등록된 운영 설정이 없습니다.
                  </Typography>
                )}
              </Box>
            </Grid>
          )}
        </OpsSectionCard>
      </Box>

      <Box ref={notificationSectionRef}>
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
                    <Badge variant="outline" size="md" shape="pill">
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
                    <Badge variant="outline" size="md" shape="pill">
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
                    <Badge variant="outline" size="md" shape="pill">
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
                    options={[...SETTINGS_IN_APP_NOTIFICATION_LEVEL_OPTIONS]}
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
                    <Badge variant="outline" size="md" shape="pill">
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
      </Box>

      <Box ref={auditSectionRef}>
        <OpsSectionCard
          title="감사 로그"
          description="운영 변경 이력을 필터링하고 변경 전후 값을 추적합니다."
        >
          <Grid className="gap-[var(--space-4)]">
            <Grid className="gap-[var(--space-2)] md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
              <Input
                value={auditQuery}
                placeholder="요약, 액션, 대상 검색"
                onChange={(event) => setAuditQuery(event.target.value)}
              />
              <Select
                value={auditSeverity}
                onChange={setAuditSeverity}
                options={[
                  { label: "전체 위험도", value: "all" },
                  { label: "info", value: "info" },
                  { label: "warning", value: "warning" },
                  { label: "critical", value: "critical" }
                ]}
              />
              <Select
                value={auditTargetType}
                onChange={setAuditTargetType}
                options={[
                  { label: "전체 대상", value: "all" },
                  { label: "설정", value: "OpsSetting" },
                  { label: "알림", value: "OpsAlert" },
                  { label: "이슈", value: "Issue" },
                  { label: "배포", value: "Deployment" },
                  { label: "리포트", value: "OpsReportSnapshot" },
                  { label: "QA", value: "QaScenario" }
                ]}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setAuditQuery("");
                  setAuditSeverity("all");
                  setAuditTargetType("all");
                }}
              >
                초기화
              </Button>
            </Grid>

            <Grid className="gap-[var(--space-4)] xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
              <Box className="divide-y divide-default border-y border-default">
                {auditLogs.map((log: OpsAuditLog) => (
                  <Button
                    key={log.id}
                    variant="ghost"
                    className="h-auto w-full justify-start rounded-none px-0 py-[var(--space-3)] text-left"
                    onClick={() => setSelectedAuditId(log.id)}
                  >
                    <Flex className="w-full items-start justify-between gap-[var(--space-3)]">
                      <Box className="min-w-0">
                        <Flex className="flex-wrap items-center gap-[var(--space-2)]">
                          <Badge
                            variant={AUDIT_SEVERITY_TONE[log.severity as keyof typeof AUDIT_SEVERITY_TONE] ?? "secondary"}
                            size="sm"
                          >
                            {log.severity}
                          </Badge>
                          <Typography as="span" className="text-body-sm font-semibold">
                            {log.summary}
                          </Typography>
                        </Flex>
                        <Typography as="p" color="muted" className="mt-[var(--space-1)] truncate text-caption">
                          {log.actor} · {log.action} · {log.targetType}
                        </Typography>
                      </Box>
                      <Badge variant={selectedAuditLog?.id === log.id ? "secondary" : "outline"} size="sm" className="shrink-0">
                        {new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(log.createdAt))}
                      </Badge>
                    </Flex>
                  </Button>
                ))}
              </Box>
              <Box className="border-default bg-surface rounded-[var(--radius-lg)] border p-[var(--space-4)]">
                {selectedAuditLog ? (
                  <Grid className="gap-[var(--space-3)]">
                    <Flex className="items-start justify-between gap-[var(--space-3)]">
                      <Box className="min-w-0">
                        <Typography as="h3" className="text-body-lg font-semibold">
                          {selectedAuditLog.summary}
                        </Typography>
                        <Typography as="p" color="muted" className="mt-[var(--space-1)] text-caption">
                          {selectedAuditLog.actor} · {selectedAuditLog.action}
                        </Typography>
                      </Box>
                      <Badge
                        variant={AUDIT_SEVERITY_TONE[selectedAuditLog.severity as keyof typeof AUDIT_SEVERITY_TONE] ?? "secondary"}
                        size="sm"
                      >
                        {selectedAuditLog.severity}
                      </Badge>
                    </Flex>
                    <Grid className="gap-[var(--space-2)] md:grid-cols-2">
                      <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                        <Typography as="p" color="muted" className="text-caption">대상</Typography>
                        <Typography as="p" className="mt-[var(--space-1)] text-body-sm font-semibold">
                          {selectedAuditLog.targetType}
                        </Typography>
                      </Box>
                      <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                        <Typography as="p" color="muted" className="text-caption">발생 시각</Typography>
                        <Typography as="p" className="mt-[var(--space-1)] text-body-sm font-semibold">
                          {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedAuditLog.createdAt))}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid className="gap-[var(--space-3)] md:grid-cols-2">
                      <Box>
                        <Typography as="p" className="mb-[var(--space-1)] text-caption font-semibold">변경 전</Typography>
                        <Box as="pre" className="bg-surface-elevated min-h-[120px] overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] p-[var(--space-3)] font-mono text-[11px] leading-[1.5] text-muted">
                          {parseJsonLabel(selectedAuditLog.beforeValue) || "기록 없음"}
                        </Box>
                      </Box>
                      <Box>
                        <Typography as="p" className="mb-[var(--space-1)] text-caption font-semibold">변경 후</Typography>
                        <Box as="pre" className="bg-surface-elevated min-h-[120px] overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] p-[var(--space-3)] font-mono text-[11px] leading-[1.5] text-muted">
                          {parseJsonLabel(selectedAuditLog.afterValue) || "기록 없음"}
                        </Box>
                      </Box>
                    </Grid>
                    <Box>
                      <Typography as="p" className="mb-[var(--space-1)] text-caption font-semibold">메타데이터</Typography>
                      <Box as="pre" className="bg-surface-elevated max-h-[160px] overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] p-[var(--space-3)] font-mono text-[11px] leading-[1.5] text-muted">
                        {parseJsonLabel(selectedAuditLog.metadata) || "기록 없음"}
                      </Box>
                    </Box>
                  </Grid>
                ) : (
                  <Typography as="p" color="muted" className="text-body-sm">
                    선택된 감사 로그가 없습니다.
                  </Typography>
                )}
              </Box>
            </Grid>
            {!auditLogsQuery.isLoading && auditLogs.length === 0 ? (
              <Typography as="p" variant="caption" color="muted">
                조건에 맞는 운영 변경 이력이 없습니다.
              </Typography>
            ) : null}
          </Grid>
        </OpsSectionCard>
      </Box>
    </OpsPageShell>
  );
}
