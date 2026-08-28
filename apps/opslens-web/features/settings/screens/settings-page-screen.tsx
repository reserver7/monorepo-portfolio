"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { getNotificationDeliveries, getOpsAuditLogs, getOpsSettings, getOpslensUsers, opslensQueryKeys, retryPendingAlertDeliveries, updateOpslensUser, upsertOpsSetting } from "@repo/opslens";
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
  const [retentionDraft, setRetentionDraft] = useState('{"logsDays":30,"alertsDays":90,"auditDays":365,"anonymizeUserIds":true}');
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
    mutationFn: ({ userId, input }: { userId: string; input: { role?: "admin" | "operator" | "viewer"; isActive?: boolean } }) =>
      updateOpslensUser(authSession!.accessToken, userId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.users() });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.auditLogs() });
      toast.success("사용자 권한을 변경했습니다.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "사용자 변경에 실패했습니다.")
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
      toast.success("연동 준비 상태를 저장했습니다.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "연동 상태 저장에 실패했습니다.")
  });
  const serviceCatalogMutation = useMutation({
    mutationFn: (value: string) => upsertOpsSetting({ key: "service.catalog", value, description: "서비스 오너·온콜·런북·SLO 카탈로그", category: "service", riskLevel: "high", editable: true, updatedBy: profileEmail || "admin", changeReason: "서비스 카탈로그 갱신" }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() }); toast.success("서비스 카탈로그를 저장했습니다."); }
  });
  const escalationPolicyMutation = useMutation({
    mutationFn: (value: string) => upsertOpsSetting({ key: "alert.escalation_policy", value, description: "중요 인시던트 확인·상태 공지 기한 및 에스컬레이션 대상", category: "alert", riskLevel: "high", editable: true, updatedBy: profileEmail || "admin", changeReason: "에스컬레이션 정책 갱신" }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() }); await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.auditLogs() }); toast.success("에스컬레이션 정책을 저장했습니다."); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "에스컬레이션 정책 저장에 실패했습니다.")
  });
  const reportScheduleMutation = useMutation({
    mutationFn: () => upsertOpsSetting({ key: "report.schedule", value: JSON.stringify({ enabled: reportSchedule.enabled, weekday: Number(reportSchedule.weekday), hour: Number(reportSchedule.hour) }), description: "주간 운영 리포트 자동 생성 일정(UTC)", category: "report", riskLevel: "medium", editable: true, updatedBy: profileEmail || "admin", changeReason: "예약 리포트 일정 갱신" }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() }); toast.success("예약 리포트 일정을 저장했습니다."); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "예약 리포트 일정 저장에 실패했습니다.")
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
  const deliveriesQuery = useQuery({ queryKey: opslensQueryKeys.notificationDeliveries(), queryFn: getNotificationDeliveries, enabled: authSession?.user.role === "admin", staleTime: 15_000 });
  const retryDeliveriesMutation = useMutation({
    mutationFn: retryPendingAlertDeliveries,
    onSuccess: async () => {
      await deliveriesQuery.refetch();
      toast.success("대기 중인 알림 delivery 재시도를 실행했습니다.");
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
      auditLogs.map((log) => [log.createdAt, log.severity, log.action, log.summary, log.actor, log.targetType, log.targetId])
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
  useEffect(() => { if (retentionSetting?.value) setRetentionDraft(retentionSetting.value); }, [retentionSetting?.value]);
  useEffect(() => {
    const raw = reportScheduleSetting?.value;
    try {
      const parsed = JSON.parse(raw ?? "{}") as { enabled?: boolean; weekday?: number; hour?: number };
      setReportSchedule({ enabled: parsed.enabled === true, weekday: String(parsed.weekday ?? 1), hour: String(parsed.hour ?? 9) });
    } catch { setReportSchedule({ enabled: false, weekday: "1", hour: "9" }); }
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
  const saveOnCallMutation = useMutation({
    mutationFn: () => {
      const normalized = onCallDraft.trim();
      if (!normalized) throw new Error("온콜 담당자 또는 인수인계 채널을 입력하세요.");
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
      toast.success("온콜 정보를 저장했습니다.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "온콜 정보 저장에 실패했습니다.")
  });
  const saveRetentionMutation = useMutation({ mutationFn: () => { JSON.parse(retentionDraft); return upsertOpsSetting({ key: "data.retention", value: retentionDraft, description: "운영 데이터 보관·익명화 정책", category: "governance", riskLevel: "high", editable: true, updatedBy: profileEmail || "admin", changeReason: "데이터 보존 정책 변경" }); }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.settings() }); toast.success("데이터 보존 정책을 저장했습니다."); }, onError: () => toast.error("보존 정책 JSON 형식을 확인하세요.") });

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
        <OpsSectionCard title="Account" description="프로필, 세션 상태, 계정 보안을 관리합니다.">
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
        <OpsSectionCard title="프로필 및 비밀번호" description="프로필 정보와 비밀번호를 한 번에 관리합니다.">
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
        <OpsSectionCard title="사용자 관리" description="사용자 역할과 계정 활성 상태를 관리합니다.">
          <UserManagementPanel
            users={usersQuery.data ?? []}
            currentUserId={authSession.user.id}
            isLoading={usersQuery.isLoading}
            pendingUserId={updateUserMutation.variables?.userId}
            onUpdate={(user, input) => updateUserMutation.mutate({ userId: user.id, input })}
          />
        </OpsSectionCard>
      ) : null}

      <OpsSectionCard title="외부 연동" description="실제 secret은 배포 환경에만 주입하고, 여기서는 연결 준비 상태와 감사 이력만 관리합니다.">
        <IntegrationCatalogPanel
          settings={settings}
          isAdmin={authSession?.user.role === "admin"}
          pendingId={integrationMutation.variables?.id}
          onSetEnabled={(id, enabled) => integrationMutation.mutate({ id, enabled })}
        />
      </OpsSectionCard>

      <OpsSectionCard title="서비스 카탈로그" description="서비스 오너, 온콜, 런북, SLO를 팀 공용 운영 데이터로 관리합니다.">
        <ServiceCatalogPanel setting={settings.find((setting) => setting.key === "service.catalog")} isAdmin={authSession?.user.role === "admin"} saving={serviceCatalogMutation.isPending} onSave={(value) => serviceCatalogMutation.mutate(value)} />
      </OpsSectionCard>

      <Box className="border-default bg-surface-elevated rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-3)]"><Typography as="p" variant="bodySm" className="font-semibold">운영 대응 설정</Typography><Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">온콜, 에스컬레이션, 알림, 리포트 일정을 한 흐름으로 관리합니다.</Typography></Box>

      <Box ref={workspaceSectionRef}>
        <OpsSectionCard title="운영 설정" description="운영 정책을 검토하고 변경 사유와 함께 저장합니다.">
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
                title: "중요 운영 설정을 변경할까요?",
                description: "변경 내용은 감사 로그에 기록되며 운영 환경에 즉시 영향을 줄 수 있습니다.",
                confirmText: "변경 저장",
                cancelText: "취소",
                confirmVariant: "danger"
              }).then((confirmed) => {
                if (confirmed) saveOpsSettingMutation.mutate();
              });
            }}
          />
        </OpsSectionCard>
      </Box>

      <Box ref={notificationSectionRef}>
      <OpsSectionCard title="1. 알림 정책" description="인앱 알림 노출 기준과 조용한 시간대를 설정합니다.">
          <NotificationPolicyPanel
            policy={notificationPolicy}
            dirty={isNotificationDirty}
            savePending={saveNotificationMutation.isPending}
            onPolicyChange={setNotificationPolicy}
            onSave={() => saveNotificationMutation.mutate()}
          />
        </OpsSectionCard>
      </Box>

      <OpsSectionCard title="2. 온콜 및 에스컬레이션" description="중요 인시던트의 최초 대응자와 인수인계 채널을 단일 운영 기록으로 관리합니다.">
        <Textarea
          label="온콜 담당자 / 채널"
          value={onCallDraft}
          onChange={(event) => setOnCallDraft(event.target.value)}
          rows={4}
          disabled={authSession?.user.role !== "admin"}
          placeholder="예: Primary: minji@company.com · Backup: jun@company.com · Slack: #incident-response"
        />
        <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-2)]">변경 내용은 감사 로그에 남으며, 커맨드 센터에서 바로 확인할 수 있습니다.</Typography>
        {authSession?.user.role === "admin" ? <Button type="button" size="sm" className="mt-[var(--space-3)]" loading={saveOnCallMutation.isPending} disabled={onCallDraft.trim() === (onCallSetting?.value ?? "").trim()} onClick={() => saveOnCallMutation.mutate()}>온콜 정보 저장</Button> : null}
      </OpsSectionCard>

      <OpsSectionCard title="3. 에스컬레이션 정책" description="확인·공지 기한을 넘긴 중요 인시던트를 커맨드 센터에서 즉시 구분합니다.">
        <EscalationPolicyPanel setting={settings.find((setting) => setting.key === "alert.escalation_policy")} isAdmin={authSession?.user.role === "admin"} saving={escalationPolicyMutation.isPending} onSave={(value) => escalationPolicyMutation.mutate(value)} />
      </OpsSectionCard>

      <Box className="border-default bg-surface-elevated rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-3)]"><Typography as="p" variant="bodySm" className="font-semibold">자동화·거버넌스</Typography><Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">예약 리포트와 데이터 보존 정책을 관리합니다.</Typography></Box>

      <OpsSectionCard title="1. 예약 운영 리포트" description="설정된 UTC 요일·시간에 전체 운영 리포트 스냅샷과 액션 아이템을 자동 생성합니다.">
        <Box className="grid gap-[var(--space-2)] sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]"><Button type="button" variant={reportSchedule.enabled ? "primary" : "secondary"} size="md" disabled={authSession?.user.role !== "admin"} onClick={() => setReportSchedule((previous) => ({ ...previous, enabled: !previous.enabled }))}>{reportSchedule.enabled ? "자동 생성 사용" : "자동 생성 중지"}</Button><Select aria-label="예약 리포트 요일" value={reportSchedule.weekday} onChange={(value) => setReportSchedule((previous) => ({ ...previous, weekday: String(value) }))} disabled={authSession?.user.role !== "admin"} options={[{ label: "일요일", value: "0" }, { label: "월요일", value: "1" }, { label: "화요일", value: "2" }, { label: "수요일", value: "3" }, { label: "목요일", value: "4" }, { label: "금요일", value: "5" }, { label: "토요일", value: "6" }]} /><Select aria-label="예약 리포트 시각" value={reportSchedule.hour} onChange={(value) => setReportSchedule((previous) => ({ ...previous, hour: String(value) }))} disabled={authSession?.user.role !== "admin"} options={[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => ({ label: `${String(hour).padStart(2, "0")}:00 UTC`, value: String(hour) }))} />{authSession?.user.role === "admin" ? <Button type="button" size="md" loading={reportScheduleMutation.isPending} onClick={() => reportScheduleMutation.mutate()}>일정 저장</Button> : null}</Box>
        <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-2)]">한국 시간은 UTC보다 9시간 빠릅니다. 예: 월요일 00:00 KST는 일요일 15:00 UTC입니다.</Typography>
      </OpsSectionCard>

      <OpsSectionCard title="2. 데이터 보존 정책" description="로그·알림·감사 로그의 보관 기간과 개인정보 익명화 기준을 관리합니다.">
        <Textarea label="보존 정책 JSON" value={retentionDraft} onChange={(event) => setRetentionDraft(event.target.value)} rows={4} disabled={authSession?.user.role !== "admin"} className="font-mono text-caption" />
        {authSession?.user.role === "admin" ? <Button type="button" size="sm" className="mt-[var(--space-2)]" loading={saveRetentionMutation.isPending} onClick={() => saveRetentionMutation.mutate()}>보존 정책 저장</Button> : null}
      </OpsSectionCard>


      <Box ref={auditSectionRef}>
        <OpsSectionCard
          title="감사 로그"
          description="운영 변경 이력을 필터링하고 변경 전후 값을 추적합니다."
        >
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

      {authSession?.user.role === "admin" ? <OpsSectionCard title="알림 delivery" description="Slack 전송 상태와 실패 재시도를 관리합니다.">
        <Box className="space-y-[var(--space-2)]">
          <Button type="button" size="sm" variant="secondary" loading={retryDeliveriesMutation.isPending} onClick={() => retryDeliveriesMutation.mutate()}>실패 delivery 재시도</Button>
          {(deliveriesQuery.data ?? []).length === 0 ? <Typography as="p" variant="bodySm" color="muted">아직 기록된 알림 delivery가 없습니다.</Typography> : (deliveriesQuery.data ?? []).map((delivery) => <Box key={delivery.id} className="border-default flex flex-wrap items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-md)] border p-[var(--space-3)]"><Typography as="p" variant="bodySm" className="font-semibold">{delivery.channel} · {delivery.status}</Typography><Typography as="p" variant="caption" color="muted">시도 {delivery.attempts}회 {delivery.lastError ? `· ${delivery.lastError}` : ""}</Typography></Box>)}
        </Box>
      </OpsSectionCard> : null}
    </OpsPageShell>
  );
}
