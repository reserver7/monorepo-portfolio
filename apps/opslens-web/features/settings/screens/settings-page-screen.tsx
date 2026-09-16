"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import {
  getNotificationDeliveries,
  getOpsAuditLogs,
  getOpsSettings,
  getOpslensUsers,
  opslensQueryKeys,
  retryPendingAlertDeliveries,
  updateOpslensUser,
  upsertOpsSetting
} from "@repo/opslens";
import { Box, Button, confirm, Select, Textarea, toast, Typography } from "@repo/ui";
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
import { SETTINGS_DEFAULT_AVATAR_COLOR } from "../constants";
import { resolveLocalizedError } from "@/lib/i18n/errors";
import {
  AccountSummaryCard,
  AuditLogPanel,
  NotificationPolicyPanel,
  OpsSettingsPanel,
  ProfileSecurityForm,
  UserManagementPanel,
  IntegrationCatalogPanel,
  ServiceCatalogPanel,
  EscalationPolicyPanel
} from "../components";
import type { PasswordFormValues, ProfileFormValues } from "../types";
import { formatSettingsDateTime, parseJsonLabel } from "../utils/settings-utils";
import { downloadCsv } from "@/features/common/utils/download-csv";

export default function SettingsPage() {
  const tError = useTranslations("error");
  const t = useTranslations("settings.screen");
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
  const [notificationPolicy, setNotificationPolicy] = useState<OpsNotificationPolicy>(() =>
    readNotificationPolicy()
  );
  const [initialNotificationPolicy, setInitialNotificationPolicy] = useState<OpsNotificationPolicy>(() =>
    readNotificationPolicy()
  );
  const [selectedSettingKey, setSelectedSettingKey] = useState("");
  const [settingValueDraft, setSettingValueDraft] = useState("");
  const [settingReasonDraft, setSettingReasonDraft] = useState("");
  const [auditQuery, setAuditQuery] = useState("");
  const [auditSeverity, setAuditSeverity] = useState("all");
  const [auditTargetType, setAuditTargetType] = useState("all");
  const [selectedAuditId, setSelectedAuditId] = useState("");
  const [onCallDraft, setOnCallDraft] = useState("");
  const [retentionDraft, setRetentionDraft] = useState(
    '{"logsDays":30,"alertsDays":90,"auditDays":365,"anonymizeUserIds":true}'
  );
  const [reportSchedule, setReportSchedule] = useState({ enabled: false, weekday: "1", hour: "9" });
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
  const authSession = readAuthSession();
  const usersQuery = useQuery({
    queryKey: opslensQueryKeys.users(),
    queryFn: () => getOpslensUsers(authSession!.accessToken),
    enabled: authSession?.user.role === "admin"
  });
  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      input
    }: {
      userId: string;
      input: { role?: "admin" | "operator" | "viewer"; isActive?: boolean };
    }) => updateOpslensUser(authSession!.accessToken, userId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.users() });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.auditLogs() });
      toast.success(t("userUpdated"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("userUpdateFailed")))
  });
  const integrationMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      upsertOpsSetting({
        key: `integration.${id}`,
        value: JSON.stringify({ enabled, updatedAt: new Date().toISOString() }),
        description: `${id} 외부 연동 준비 상태`,
        category: "integration",
        riskLevel: "medium",
        editable: true,
        updatedBy: profileEmail || "admin",
        changeReason: enabled ? "외부 연동 준비 상태 활성화" : "외부 연동 준비 상태 비활성화"
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.auditLogs() });
      toast.success(t("integrationSaved"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("integrationSaveFailed")))
  });
  const serviceCatalogMutation = useMutation({
    mutationFn: (value: string) =>
      upsertOpsSetting({
        key: "service.catalog",
        value,
        description: "서비스 오너·온콜·런북·SLO 카탈로그",
        category: "service",
        riskLevel: "high",
        editable: true,
        updatedBy: profileEmail || "admin",
        changeReason: "서비스 카탈로그 갱신"
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() });
      toast.success(t("catalogSaved"));
    }
  });
  const escalationPolicyMutation = useMutation({
    mutationFn: (value: string) =>
      upsertOpsSetting({
        key: "alert.escalation_policy",
        value,
        description: "중요 인시던트 확인·상태 공지 기한 및 에스컬레이션 대상",
        category: "alert",
        riskLevel: "high",
        editable: true,
        updatedBy: profileEmail || "admin",
        changeReason: "에스컬레이션 정책 갱신"
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.auditLogs() });
      toast.success(t("escalationSaved"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("escalationSaveFailed")))
  });
  const reportScheduleMutation = useMutation({
    mutationFn: () =>
      upsertOpsSetting({
        key: "report.schedule",
        value: JSON.stringify({
          enabled: reportSchedule.enabled,
          weekday: Number(reportSchedule.weekday),
          hour: Number(reportSchedule.hour)
        }),
        description: "주간 운영 리포트 자동 생성 일정(UTC)",
        category: "report",
        riskLevel: "medium",
        editable: true,
        updatedBy: profileEmail || "admin",
        changeReason: "예약 리포트 일정 갱신"
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() });
      toast.success(t("scheduleSaved"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("scheduleSaveFailed")))
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
  const deliveriesQuery = useQuery({
    queryKey: opslensQueryKeys.notificationDeliveries(),
    queryFn: getNotificationDeliveries,
    enabled: authSession?.user.role === "admin",
    staleTime: 15_000
  });
  const retryDeliveriesMutation = useMutation({
    mutationFn: retryPendingAlertDeliveries,
    onSuccess: async () => {
      await deliveriesQuery.refetch();
      toast.success(t("deliveryRetried"));
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

  const settings = opsSettingsQuery.data ?? [];
  const onCallSetting = settings.find((setting) => setting.key === "alert.on_call");
  const retentionSetting = settings.find((setting) => setting.key === "data.retention");
  const reportScheduleSetting = settings.find((setting) => setting.key === "report.schedule");
  const auditLogs = auditLogsQuery.data ?? [];
  const selectedSetting = settings.find((setting) => setting.key === selectedSettingKey) ?? settings[0];
  const selectedAuditLog = auditLogs.find((log) => log.id === selectedAuditId) ?? auditLogs[0];

  const exportAuditLogs = () => {
    downloadCsv(
      `opslens-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
      ["시간", "위험도", "행위", "요약", "수행자", "대상", "대상 ID"],
      auditLogs.map((log) => [
        log.createdAt,
        log.severity,
        log.action,
        log.summary,
        log.actor,
        log.targetType,
        log.targetId
      ])
    );
  };

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
    if (!onCallSetting) return;
    setOnCallDraft(onCallSetting.value);
  }, [onCallSetting?.value]);
  useEffect(() => {
    if (retentionSetting?.value) setRetentionDraft(retentionSetting.value);
  }, [retentionSetting?.value]);
  useEffect(() => {
    const raw = reportScheduleSetting?.value;
    try {
      const parsed = JSON.parse(raw ?? "{}") as { enabled?: boolean; weekday?: number; hour?: number };
      setReportSchedule({
        enabled: parsed.enabled === true,
        weekday: String(parsed.weekday ?? 1),
        hour: String(parsed.hour ?? 9)
      });
    } catch {
      setReportSchedule({ enabled: false, weekday: "1", hour: "9" });
    }
  }, [reportScheduleSetting?.value]);

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
    mutationFn: (values: { name: string; avatarColor?: string }) => updateCurrentProfile(values),
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
      toast.error(resolveLocalizedError(error, tError as never, t("profileSaveFailed")));
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
      toast.error(resolveLocalizedError(error, tError as never, t("passwordSaveFailed")));
    }
  });

  const submitPassword = passwordForm.handleSubmit((values) => {
    if (values.newPassword !== values.confirmPassword) {
      passwordForm.setError("confirmPassword", { message: t("passwordMismatch") });
      return;
    }
    passwordMutation.mutate({
      currentPassword: values.currentPassword.trim(),
      newPassword: values.newPassword.trim()
    });
  });
  const providerLabel =
    profileProvider === "local" ? "Local" : profileProvider === "google" ? "Google" : "GitHub";
  const securityLabel = profileProvider === "local" ? "비밀번호 로그인" : "소셜 로그인";
  const securityTone = profileProvider === "local" ? "success" : "secondary";
  const roleLabel = profileRole ? profileRole.charAt(0).toUpperCase() + profileRole.slice(1) : "-";
  const sessionTypeLabel = useMemo(() => {
    return readAuthSession()?.storageMode === "session" ? "Session" : "Persistent";
  }, []);
  const sessionExpiresLabel = sessionExpiresAt ? formatSettingsDateTime(sessionExpiresAt) : "-";

  const selectedSettingChanged =
    Boolean(selectedSetting) &&
    (settingValueDraft.trim() !== parseJsonLabel(selectedSetting?.value).trim() ||
      settingReasonDraft.trim().length > 0);

  const saveOpsSettingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSetting) throw new Error(t("selectSetting"));
      try {
        JSON.parse(settingValueDraft);
      } catch {
        throw new Error(t("invalidJson"));
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
      toast.success(t("opsSettingsSaved"));
    },
    onError: (error) => {
      toast.error(resolveLocalizedError(error, tError as never, t("opsSettingsSaveFailed")));
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
      toast.success(t("notificationSaved"));
    },
    onError: () => {
      toast.error(t("notificationSaveFailed"));
    }
  });
  const saveOnCallMutation = useMutation({
    mutationFn: () => {
      const normalized = onCallDraft.trim();
      if (!normalized) throw new Error(t("onCallRequired"));
      return upsertOpsSetting({
        key: "alert.on_call",
        value: normalized,
        description: "현재 온콜 담당자와 에스컬레이션 채널",
        category: "alert",
        riskLevel: "high",
        editable: true,
        updatedBy: profileEmail || "admin",
        changeReason: "온콜 및 에스컬레이션 연락처 변경"
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.auditLogs() });
      toast.success(t("onCallSaved"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("onCallSaveFailed")))
  });
  const saveRetentionMutation = useMutation({
    mutationFn: () => {
      JSON.parse(retentionDraft);
      return upsertOpsSetting({
        key: "data.retention",
        value: retentionDraft,
        description: "운영 데이터 보관·익명화 정책",
        category: "governance",
        riskLevel: "high",
        editable: true,
        updatedBy: profileEmail || "admin",
        changeReason: "데이터 보존 정책 변경"
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() });
      toast.success(t("retentionSaved"));
    },
    onError: () => toast.error(t("retentionInvalid"))
  });

  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      await logoutCurrentSession();
      clearAuthSession();
    },
    onSuccess: () => {
      toast.success(t("sessionEnded"));
      router.replace("/login");
    },
    onError: () => {
      toast.error(t("sessionEndFailed"));
    }
  });

  const isProfileDirty =
    profileForm.getValues("name").trim() !== profileName || avatarColor !== initialAvatarColor;
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
        passwordForm.setError("confirmPassword", { message: t("passwordMismatch") });
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
      toast.success(t("changesSaved"));
    } catch {
      // Individual mutation onError handlers already surface error toasts.
    }
  };

  return (
    <OpsPageShell>
      <Box>
        <OpsSectionCard title={t("accountTitle")} description={t("accountDescription")}>
          <AccountSummaryCard
            profileName={profileName}
            profileEmail={profileEmail}
            roleLabel={roleLabel}
            providerLabel={providerLabel}
            securityLabel={securityLabel}
            securityTone={securityTone}
            avatarColor={avatarColor}
            sessionTypeLabel={sessionTypeLabel}
            sessionExpiresLabel={sessionExpiresLabel}
            logoutPending={logoutAllMutation.isPending}
            onLogoutCurrentSession={() => logoutAllMutation.mutate()}
          />
        </OpsSectionCard>
      </Box>

      <Box ref={profileSectionRef}>
        <OpsSectionCard title={t("profileTitle")} description={t("profileDescription")}>
          <ProfileSecurityForm
            profileProvider={profileProvider}
            avatarColor={avatarColor}
            profileControl={profileForm.control}
            passwordControl={passwordForm.control}
            profileNameError={profileForm.formState.errors.name?.message}
            currentPasswordError={passwordForm.formState.errors.currentPassword?.message}
            newPasswordError={passwordForm.formState.errors.newPassword?.message}
            confirmPasswordError={passwordForm.formState.errors.confirmPassword?.message}
            canSubmit={canSubmitProfileSecurity}
            submitting={isProfileSecuritySubmitting}
            onAvatarColorChange={setAvatarColor}
            onSubmitProfile={submitProfile}
            onSubmitPassword={submitPassword}
            onSave={handleSaveProfileSecurity}
          />
        </OpsSectionCard>
      </Box>

      {authSession?.user.role === "admin" ? (
        <OpsSectionCard title={t("usersTitle")} description={t("usersDescription")}>
          <UserManagementPanel
            users={usersQuery.data ?? []}
            currentUserId={authSession.user.id}
            isLoading={usersQuery.isLoading}
            pendingUserId={updateUserMutation.variables?.userId}
            onUpdate={(user, input) => updateUserMutation.mutate({ userId: user.id, input })}
          />
        </OpsSectionCard>
      ) : null}

      <OpsSectionCard title={t("integrationTitle")} description={t("integrationDescription")}>
        <IntegrationCatalogPanel
          settings={settings}
          isAdmin={authSession?.user.role === "admin"}
          pendingId={integrationMutation.variables?.id}
          onSetEnabled={(id, enabled) => integrationMutation.mutate({ id, enabled })}
        />
      </OpsSectionCard>

      <OpsSectionCard title={t("catalogTitle")} description={t("catalogDescription")}>
        <ServiceCatalogPanel
          setting={settings.find((setting) => setting.key === "service.catalog")}
          isAdmin={authSession?.user.role === "admin"}
          saving={serviceCatalogMutation.isPending}
          onSave={(value) => serviceCatalogMutation.mutate(value)}
        />
      </OpsSectionCard>

      <Box className="border-default bg-surface-elevated rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-3)]">
        <Typography as="p" variant="bodySm" className="font-semibold">
          {t("responseSettings")}
        </Typography>
        <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">
          {t("responseSettingsDescription")}
        </Typography>
      </Box>

      <Box ref={workspaceSectionRef}>
        <OpsSectionCard title={t("opsSettingsTitle")} description={t("opsSettingsDescription")}>
          <OpsSettingsPanel
            isError={opsSettingsQuery.isError}
            settings={settings}
            selectedSetting={selectedSetting}
            valueDraft={settingValueDraft}
            reasonDraft={settingReasonDraft}
            selectedChanged={selectedSettingChanged}
            savePending={saveOpsSettingMutation.isPending}
            onSelectSetting={(setting) => {
              setSelectedSettingKey(setting.key);
              setSettingValueDraft(parseJsonLabel(setting.value));
              setSettingReasonDraft("");
            }}
            onValueDraftChange={setSettingValueDraft}
            onReasonDraftChange={setSettingReasonDraft}
            onResetDraft={() => {
              if (!selectedSetting) return;
              setSettingValueDraft(parseJsonLabel(selectedSetting.value));
              setSettingReasonDraft("");
            }}
            onSave={() => {
              if (selectedSetting?.riskLevel !== "critical") {
                saveOpsSettingMutation.mutate();
                return;
              }
              void confirm({
                title: t("criticalConfirmTitle"),
                description: t("criticalConfirmDescription"),
                confirmText: t("saveChange"),
                cancelText: t("cancel"),
                confirmVariant: "danger"
              }).then((confirmed) => {
                if (confirmed) saveOpsSettingMutation.mutate();
              });
            }}
          />
        </OpsSectionCard>
      </Box>

      <Box ref={notificationSectionRef}>
        <OpsSectionCard title={t("notificationTitle")} description={t("notificationDescription")}>
          <NotificationPolicyPanel
            policy={notificationPolicy}
            dirty={isNotificationDirty}
            savePending={saveNotificationMutation.isPending}
            onPolicyChange={setNotificationPolicy}
            onSave={() => saveNotificationMutation.mutate()}
          />
        </OpsSectionCard>
      </Box>

      <OpsSectionCard title={t("onCallTitle")} description={t("onCallDescription")}>
        <Textarea
          label={t("onCallField")}
          value={onCallDraft}
          onChange={(event) => setOnCallDraft(event.target.value)}
          rows={4}
          disabled={authSession?.user.role !== "admin"}
          placeholder={t("onCallPlaceholder")}
        />
        <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-2)]">
          {t("auditHint")}
        </Typography>
        {authSession?.user.role === "admin" ? (
          <Button
            type="button"
            size="sm"
            className="mt-[var(--space-3)]"
            loading={saveOnCallMutation.isPending}
            disabled={onCallDraft.trim() === (onCallSetting?.value ?? "").trim()}
            onClick={() => saveOnCallMutation.mutate()}
          >
            {t("saveOnCall")}
          </Button>
        ) : null}
      </OpsSectionCard>

      <OpsSectionCard title={t("escalationTitle")} description={t("escalationDescription")}>
        <EscalationPolicyPanel
          setting={settings.find((setting) => setting.key === "alert.escalation_policy")}
          isAdmin={authSession?.user.role === "admin"}
          saving={escalationPolicyMutation.isPending}
          onSave={(value) => escalationPolicyMutation.mutate(value)}
        />
      </OpsSectionCard>

      <Box className="border-default bg-surface-elevated rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-3)]">
        <Typography as="p" variant="bodySm" className="font-semibold">
          {t("automationTitle")}
        </Typography>
        <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">
          {t("automationDescription")}
        </Typography>
      </Box>

      <OpsSectionCard title={t("scheduleTitle")} description={t("scheduleDescription")}>
        <Box className="grid gap-[var(--space-2)] sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Button
            type="button"
            variant={reportSchedule.enabled ? "primary" : "secondary"}
            size="md"
            disabled={authSession?.user.role !== "admin"}
            onClick={() => setReportSchedule((previous) => ({ ...previous, enabled: !previous.enabled }))}
          >
            {reportSchedule.enabled ? t("scheduleEnabled") : t("scheduleDisabled")}
          </Button>
          <Select
            aria-label={t("weekday")}
            value={reportSchedule.weekday}
            onChange={(value) => setReportSchedule((previous) => ({ ...previous, weekday: String(value) }))}
            disabled={authSession?.user.role !== "admin"}
            options={[
              { label: t("weekdays.sun"), value: "0" },
              { label: t("weekdays.mon"), value: "1" },
              { label: t("weekdays.tue"), value: "2" },
              { label: t("weekdays.wed"), value: "3" },
              { label: t("weekdays.thu"), value: "4" },
              { label: t("weekdays.fri"), value: "5" },
              { label: t("weekdays.sat"), value: "6" }
            ]}
          />
          <Select
            aria-label={t("scheduleTime")}
            value={reportSchedule.hour}
            onChange={(value) => setReportSchedule((previous) => ({ ...previous, hour: String(value) }))}
            disabled={authSession?.user.role !== "admin"}
            options={[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => ({
              label: `${String(hour).padStart(2, "0")}:00 UTC`,
              value: String(hour)
            }))}
          />
          {authSession?.user.role === "admin" ? (
            <Button
              type="button"
              size="md"
              loading={reportScheduleMutation.isPending}
              onClick={() => reportScheduleMutation.mutate()}
            >
              {t("saveSchedule")}
            </Button>
          ) : null}
        </Box>
        <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-2)]">
          {t("timezoneHint")}
        </Typography>
      </OpsSectionCard>

      <OpsSectionCard title={t("retentionTitle")} description={t("retentionDescription")}>
        <Textarea
          label={t("retentionJson")}
          value={retentionDraft}
          onChange={(event) => setRetentionDraft(event.target.value)}
          rows={4}
          disabled={authSession?.user.role !== "admin"}
          className="text-caption font-mono"
        />
        {authSession?.user.role === "admin" ? (
          <Button
            type="button"
            size="sm"
            className="mt-[var(--space-2)]"
            loading={saveRetentionMutation.isPending}
            onClick={() => saveRetentionMutation.mutate()}
          >
            {t("saveRetention")}
          </Button>
        ) : null}
      </OpsSectionCard>

      <Box ref={auditSectionRef}>
        <OpsSectionCard title={t("auditTitle")} description={t("auditDescription")}>
          <AuditLogPanel
            auditLogs={auditLogs}
            selectedAuditLog={selectedAuditLog}
            isLoading={auditLogsQuery.isLoading}
            query={auditQuery}
            severity={auditSeverity}
            targetType={auditTargetType}
            onQueryChange={setAuditQuery}
            onSeverityChange={setAuditSeverity}
            onTargetTypeChange={setAuditTargetType}
            onSelectAuditLog={setSelectedAuditId}
            onResetFilters={() => {
              setAuditQuery("");
              setAuditSeverity("all");
              setAuditTargetType("all");
            }}
            onExport={exportAuditLogs}
          />
        </OpsSectionCard>
      </Box>

      {authSession?.user.role === "admin" ? (
        <OpsSectionCard title={t("deliveryTitle")} description={t("deliveryDescription")}>
          <Box className="space-y-[var(--space-2)]">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={retryDeliveriesMutation.isPending}
              onClick={() => retryDeliveriesMutation.mutate()}
            >
              {t("retryDelivery")}
            </Button>
            {(deliveriesQuery.data ?? []).length === 0 ? (
              <Typography as="p" variant="bodySm" color="muted">
                {t("noDeliveries")}
              </Typography>
            ) : (
              (deliveriesQuery.data ?? []).map((delivery) => (
                <Box
                  key={delivery.id}
                  className="border-default flex flex-wrap items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-md)] border p-[var(--space-3)]"
                >
                  <Typography as="p" variant="bodySm" className="font-semibold">
                    {delivery.channel} · {delivery.status}
                  </Typography>
                  <Typography as="p" variant="caption" color="muted">
                    시도 {delivery.attempts}회 {delivery.lastError ? `· ${delivery.lastError}` : ""}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </OpsSectionCard>
      ) : null}
    </OpsPageShell>
  );
}
