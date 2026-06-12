"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { getOpsAuditLogs, getOpsSettings, opslensQueryKeys, upsertOpsSetting } from "@repo/opslens";
import { Box, toast } from "@repo/ui";
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
import { AccountSummaryCard, AuditLogPanel, NotificationPolicyPanel, OpsSettingsPanel, ProfileSecurityForm } from "../components";
import type { PasswordFormValues, ProfileFormValues } from "../types";
import { formatSettingsDateTime, parseJsonLabel } from "../utils/settings-utils";

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
    ? formatSettingsDateTime(sessionExpiresAt)
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
        <OpsSectionCard
          title="프로필 및 비밀번호"
          description="프로필 정보와 비밀번호를 한 번에 관리합니다."
        >
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

      <Box ref={workspaceSectionRef}>
        <OpsSectionCard
          title="운영 설정"
          description="운영 정책을 검토하고 변경 사유와 함께 저장합니다."
        >
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
            onSave={() => saveOpsSettingMutation.mutate()}
          />
        </OpsSectionCard>
      </Box>

      <Box ref={notificationSectionRef}>
        <OpsSectionCard
          title="알림 정책"
          description="인앱 알림 노출 기준과 조용한 시간대를 설정합니다."
        >
          <NotificationPolicyPanel
            policy={notificationPolicy}
            dirty={isNotificationDirty}
            savePending={saveNotificationMutation.isPending}
            onPolicyChange={setNotificationPolicy}
            onSave={() => saveNotificationMutation.mutate()}
          />
        </OpsSectionCard>
      </Box>

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
          />
        </OpsSectionCard>
      </Box>
    </OpsPageShell>
  );
}
