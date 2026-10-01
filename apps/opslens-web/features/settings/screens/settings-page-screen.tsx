"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import {
  getNotificationDeliveries,
  getOpslensInvitations,
  getOpsAuditLogs,
  getOpsSettings,
  getOpslensUsers,
  getOpslensUserDetails,
  getOpslensUserActivity,
  exportOpslensUserActivityCsv,
  getOpslensSecuritySummary,
  getOpslensSecurityEvents,
  getOpslensSecurityEventDetails,
  getOpslensSecurityNotifications,
  markOpslensSecurityNotificationRead,
  reviewOpslensSecurityEvent,
  bulkReviewOpslensSecurityEvents,
  bulkUpdateOpslensUsers,
  bulkRevokeOpslensUserSessions,
  opslensQueryKeys,
  retryPendingAlertDeliveries,
  inviteOpslensUser,
  resendOpslensInvitation,
  revokeOpslensInvitation,
  revokeOpslensUserSessions,
  revokeOpslensUserSession,
  updateOpslensUser,
  upsertOpsSetting
} from "@repo/opslens";
import type { AuthRole } from "@repo/opslens";
import { Box, Button, confirm, promptConfirm, Select, Textarea, toast, Typography } from "@repo/ui";
import { OpsPageShell, OpsSectionCard } from "@/features";
import {
  changeCurrentPassword,
  clearAuthSession,
  deleteCurrentAccount,
  listCurrentSessions,
  listSecurityActivity,
  fetchNotificationPolicy,
  logoutCurrentSession,
  revokeAllSessions,
  revokeSession,
  readNotificationPolicy,
  readAuthAvatarColor,
  readAuthSession,
  requestEmailChange,
  confirmTwoFactor,
  disableTwoFactor,
  cancelTwoFactorSetup,
  regenerateRecoveryCodes,
  getTwoFactorStatus,
  setupTwoFactor,
  updateNotificationPolicy,
  type OpsNotificationPolicy,
  setAuthAvatarColor,
  updateCurrentProfile
} from "@/lib/auth";
import { SETTINGS_DEFAULT_AVATAR_COLOR } from "../constants";
import { resolveLocalizedError } from "@/lib/i18n/errors";
import {
  AccountSummaryCard,
  AccountDangerZone,
  AdminInvitationPanel,
  ActiveSessionsPanel,
  EmailChangeForm,
  TwoFactorPanel,
  SecurityActivityPanel,
  AuditLogPanel,
  NotificationPolicyPanel,
  OpsSettingsPanel,
  ProfileSecurityForm,
  UserManagementPanel,
  AdminSecuritySummaryPanel,
  AdminSecurityEventReviewPanel,
  AdminSecurityNotificationPanel,
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
  const tUsers = useTranslations("settings.users");
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const profileSectionRef = useRef<HTMLDivElement | null>(null);
  const workspaceSectionRef = useRef<HTMLDivElement | null>(null);
  const notificationSectionRef = useRef<HTMLDivElement | null>(null);
  const auditSectionRef = useRef<HTMLDivElement | null>(null);
  const [profileName, setProfileName] = useState("User");
  const [profileEmail, setProfileEmail] = useState("-");
  const [emailDraft, setEmailDraft] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "operator" | "viewer">("operator");
  const [inviteLink, setInviteLink] = useState<string>();
  const [inviteDeliverySent, setInviteDeliverySent] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState("");
  const [twoFactorSetup, setTwoFactorSetup] = useState<Awaited<ReturnType<typeof setupTwoFactor>> | null>(
    null
  );
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
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
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<AuthRole | "all">("all");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [userPage, setUserPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [activityAction, setActivityAction] = useState("all");
  const [activityFrom, setActivityFrom] = useState("");
  const [activityTo, setActivityTo] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [securityEventStatus, setSecurityEventStatus] = useState<
    "all" | "unreviewed" | "in_review" | "resolved"
  >("all");
  const [securityEventSeverity, setSecurityEventSeverity] = useState("all");
  const [securityEventAssignee, setSecurityEventAssignee] = useState("");
  const [securityEventPage, setSecurityEventPage] = useState(1);
  const [selectedSecurityEventId, setSelectedSecurityEventId] = useState<string>();
  const [selectedSecurityEventIds, setSelectedSecurityEventIds] = useState<string[]>([]);
  const observedHighRiskEventIds = useRef<Set<string> | null>(null);
  const sessionsQuery = useQuery({
    queryKey: opslensQueryKeys.sessions(),
    queryFn: listCurrentSessions,
    enabled: Boolean(authSession),
    staleTime: 15_000
  });
  const securityActivityQuery = useQuery({
    queryKey: opslensQueryKeys.securityActivity(),
    queryFn: listSecurityActivity,
    enabled: Boolean(authSession),
    staleTime: 15_000
  });
  const twoFactorQuery = useQuery({
    queryKey: ["opslens", "two-factor"],
    queryFn: getTwoFactorStatus,
    enabled: Boolean(authSession),
    staleTime: 30_000
  });
  const usersQuery = useQuery({
    queryKey: [...opslensQueryKeys.users(), userSearch, userRoleFilter, userStatusFilter, userPage],
    queryFn: () =>
      getOpslensUsers(authSession!.accessToken, {
        query: userSearch,
        role: userRoleFilter,
        isActive: userStatusFilter === "all" ? "all" : userStatusFilter === "active",
        page: userPage,
        pageSize: 20
      }),
    enabled: authSession?.user.role === "admin"
  });
  const securitySummaryQuery = useQuery({
    queryKey: ["opslens", "security-summary"],
    queryFn: () => getOpslensSecuritySummary(authSession!.accessToken),
    enabled: authSession?.user.role === "admin",
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false
  });
  const securityEventsQuery = useQuery({
    queryKey: [
      "opslens",
      "security-events",
      securityEventStatus,
      securityEventSeverity,
      securityEventAssignee,
      securityEventPage
    ],
    queryFn: () =>
      getOpslensSecurityEvents(authSession!.accessToken, {
        reviewStatus: securityEventStatus,
        severity: securityEventSeverity,
        assignee: securityEventAssignee,
        page: securityEventPage,
        pageSize: 10
      }),
    enabled: authSession?.user.role === "admin",
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false
  });
  const securityEventDetailsQuery = useQuery({
    queryKey: ["opslens", "security-event-details", selectedSecurityEventId],
    queryFn: () => getOpslensSecurityEventDetails(authSession!.accessToken, selectedSecurityEventId!),
    enabled: authSession?.user.role === "admin" && Boolean(selectedSecurityEventId),
    staleTime: 15_000
  });
  const securityNotificationsQuery = useQuery({
    queryKey: ["opslens", "security-notifications"],
    queryFn: () => getOpslensSecurityNotifications(authSession!.accessToken),
    enabled: authSession?.user.role === "admin",
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false
  });
  const reviewSecurityEventMutation = useMutation({
    mutationFn: ({
      eventId,
      input
    }: {
      eventId: string;
      input: {
        reviewStatus: "unreviewed" | "in_review" | "resolved";
        assignee?: string;
        reviewNote?: string;
      };
    }) => reviewOpslensSecurityEvent(authSession!.accessToken, eventId, input),
    onSuccess: async () => {
      await Promise.all([
        securityEventsQuery.refetch(),
        securitySummaryQuery.refetch(),
        selectedSecurityEventId ? securityEventDetailsQuery.refetch() : Promise.resolve()
      ]);
      toast.success(t("securityReviewSaved"));
    },
    onError: (error) =>
      toast.error(resolveLocalizedError(error, tError as never, t("securityReviewSaveFailed")))
  });
  const bulkReviewSecurityEventsMutation = useMutation({
    mutationFn: (input: {
      eventIds: string[];
      reviewStatus: "unreviewed" | "in_review" | "resolved";
      assignee?: string;
      reviewNote?: string;
    }) => bulkReviewOpslensSecurityEvents(authSession!.accessToken, input),
    onSuccess: async () => {
      setSelectedSecurityEventIds([]);
      await Promise.all([
        securityEventsQuery.refetch(),
        securitySummaryQuery.refetch(),
        selectedSecurityEventId ? securityEventDetailsQuery.refetch() : Promise.resolve()
      ]);
      toast.success(t("securityBulkReviewSaved"));
    },
    onError: (error) =>
      toast.error(resolveLocalizedError(error, tError as never, t("securityBulkReviewSaveFailed")))
  });
  const markSecurityNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markOpslensSecurityNotificationRead(authSession!.accessToken, notificationId),
    onSuccess: () => securityNotificationsQuery.refetch()
  });

  useEffect(() => {
    const isLiveView =
      securityEventStatus === "all" &&
      securityEventSeverity === "all" &&
      securityEventAssignee.trim() === "" &&
      securityEventPage === 1;
    if (!isLiveView) {
      observedHighRiskEventIds.current = null;
      return;
    }
    const events = securityEventsQuery.data?.items;
    if (!events) return;
    const currentIds = new Set(
      events
        .filter(
          (event) =>
            event.reviewStatus === "unreviewed" &&
            (event.severity === "warning" || event.severity === "critical")
        )
        .map((event) => event.id)
    );
    const previousIds = observedHighRiskEventIds.current;
    if (previousIds) {
      const newCount = [...currentIds].filter((id) => !previousIds.has(id)).length;
      if (newCount > 0) toast.info(t("securityLiveAlert", { count: newCount }));
    }
    observedHighRiskEventIds.current = currentIds;
  }, [
    securityEventAssignee,
    securityEventPage,
    securityEventSeverity,
    securityEventStatus,
    securityEventsQuery.data,
    t
  ]);
  const invitationsQuery = useQuery({
    queryKey: ["opslens", "invitations"],
    queryFn: () => getOpslensInvitations(authSession!.accessToken),
    enabled: authSession?.user.role === "admin",
    staleTime: 15_000
  });
  const userDetailsQuery = useQuery({
    queryKey: ["opslens", "user-details", selectedUserId],
    queryFn: () => getOpslensUserDetails(authSession!.accessToken, selectedUserId!),
    enabled: authSession?.user.role === "admin" && Boolean(selectedUserId)
  });
  const userActivityQuery = useQuery({
    queryKey: [
      "opslens",
      "user-activity",
      selectedUserId,
      activityAction,
      activityFrom,
      activityTo,
      activityPage
    ],
    queryFn: () =>
      getOpslensUserActivity(authSession!.accessToken, selectedUserId!, {
        action: activityAction,
        from: activityFrom ? new Date(`${activityFrom}T00:00:00.000Z`).toISOString() : undefined,
        to: activityTo ? new Date(`${activityTo}T23:59:59.999Z`).toISOString() : undefined,
        page: activityPage,
        pageSize: 10
      }),
    enabled: authSession?.user.role === "admin" && Boolean(selectedUserId)
  });
  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      input
    }: {
      userId: string;
      input: { role?: "admin" | "operator" | "viewer"; isActive?: boolean; reason: string };
    }) => updateOpslensUser(authSession!.accessToken, userId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.users() });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.auditLogs() });
      toast.success(t("userUpdated"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("userUpdateFailed")))
  });
  const revokeUserSessionsMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      revokeOpslensUserSessions(authSession!.accessToken, userId, reason),
    onSuccess: () => toast.success(t("userSessionsRevoked")),
    onError: (error) =>
      toast.error(resolveLocalizedError(error, tError as never, t("userSessionsRevokeFailed")))
  });
  const bulkUpdateUsersMutation = useMutation({
    mutationFn: (input: { userIds: string[]; isActive: boolean; reason: string }) =>
      bulkUpdateOpslensUsers(authSession!.accessToken, input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.users() });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.auditLogs() });
      toast.success(t("bulkUsersUpdated", { count: result.updatedCount }));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("bulkUsersUpdateFailed")))
  });
  const bulkRevokeUserSessionsMutation = useMutation({
    mutationFn: ({ userIds, reason }: { userIds: string[]; reason: string }) =>
      bulkRevokeOpslensUserSessions(authSession!.accessToken, userIds, reason),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.auditLogs() });
      toast.success(t("bulkUserSessionsRevoked", { count: result.revokedCount }));
    },
    onError: (error) =>
      toast.error(resolveLocalizedError(error, tError as never, t("bulkUserSessionsRevokeFailed")))
  });
  const revokeUserSessionMutation = useMutation({
    mutationFn: ({ userId, sessionId, reason }: { userId: string; sessionId: string; reason: string }) =>
      revokeOpslensUserSession(authSession!.accessToken, userId, sessionId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["opslens", "user-details", selectedUserId] });
      toast.success(t("userSessionRevoked"));
    },
    onError: (error) =>
      toast.error(resolveLocalizedError(error, tError as never, t("userSessionsRevokeFailed")))
  });
  const inviteUserMutation = useMutation({
    mutationFn: () =>
      inviteOpslensUser(authSession!.accessToken, { email: inviteEmail.trim(), role: inviteRole }),
    onSuccess: async (result) => {
      setInviteEmail("");
      setInviteLink(result.inviteUrl);
      setInviteDeliverySent(result.emailDelivery.sent);
      await queryClient.invalidateQueries({ queryKey: ["opslens", "invitations"] });
      toast.success(t("inviteSent"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("inviteFailed")))
  });
  const resendInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => resendOpslensInvitation(authSession!.accessToken, invitationId),
    onSuccess: async (result) => {
      setInviteLink(result.inviteUrl);
      setInviteDeliverySent(result.emailDelivery.sent);
      await queryClient.invalidateQueries({ queryKey: ["opslens", "invitations"] });
      toast.success(t("inviteResent"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("inviteFailed")))
  });
  const revokeInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => revokeOpslensInvitation(authSession!.accessToken, invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["opslens", "invitations"] });
      toast.success(t("inviteRevoked"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("inviteFailed")))
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
    setEmailDraft(session.user.email);
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
  const emailChangeMutation = useMutation({
    mutationFn: (email: string) => requestEmailChange(email),
    onSuccess: (result) => {
      toast.success(result.sent ? t("emailChangeRequested") : t("emailChangeUnavailable"));
      void queryClient.invalidateQueries({ queryKey: opslensQueryKeys.securityActivity() });
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("emailChangeFailed")))
  });
  const twoFactorSetupMutation = useMutation({
    mutationFn: setupTwoFactor,
    onSuccess: (result) => setTwoFactorSetup(result),
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("twoFactorFailed")))
  });
  const twoFactorConfirmMutation = useMutation({
    mutationFn: confirmTwoFactor,
    onSuccess: async (result) => {
      setTwoFactorSetup(null);
      setRecoveryCodes(result.recoveryCodes);
      await queryClient.invalidateQueries({ queryKey: ["opslens", "two-factor"] });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.securityActivity() });
      toast.success(t("twoFactorEnabledToast"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("twoFactorFailed")))
  });
  const twoFactorDisableMutation = useMutation({
    mutationFn: disableTwoFactor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["opslens", "two-factor"] });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.securityActivity() });
      toast.success(t("twoFactorDisabledToast"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("twoFactorFailed")))
  });
  const twoFactorSetupCancelMutation = useMutation({
    mutationFn: cancelTwoFactorSetup,
    onSuccess: async () => {
      setTwoFactorSetup(null);
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.securityActivity() });
      toast.success(t("twoFactorSetupCancelledToast"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("twoFactorFailed")))
  });
  const recoveryCodeRegenerationMutation = useMutation({
    mutationFn: regenerateRecoveryCodes,
    onSuccess: async (result) => {
      setRecoveryCodes(result.recoveryCodes);
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.securityActivity() });
      toast.success(t("recoveryCodesRegeneratedToast"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("twoFactorFailed")))
  });

  const submitProfile = profileForm.handleSubmit((values) => {
    profileMutation.mutate({ name: values.name.trim(), avatarColor });
  });

  const passwordMutation = useMutation({
    mutationFn: (values: { currentPassword: string; newPassword: string }) => changeCurrentPassword(values),
    onSuccess: async () => {
      passwordForm.reset();
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.sessions() });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.securityActivity() });
      toast.success(t("passwordChangedToast"));
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

  const revokeSessionMutation = useMutation({
    mutationFn: (session: { id: string }) => revokeSession(session.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.sessions() });
      toast.success(t("sessionRevoked"));
    },
    onError: () => toast.error(t("sessionRevokeFailed"))
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => {
      clearAuthSession();
      router.replace("/login");
    },
    onError: () => toast.error(t("sessionRevokeFailed"))
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => deleteCurrentAccount(deleteAccountPassword),
    onSuccess: () => {
      clearAuthSession();
      router.replace("/login");
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("deleteAccountFailed")))
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
          <AccountDangerZone
            email={profileEmail}
            currentPassword={deleteAccountPassword}
            confirmation={deleteAccountConfirmation}
            pending={deleteAccountMutation.isPending}
            onPasswordChange={setDeleteAccountPassword}
            onConfirmationChange={setDeleteAccountConfirmation}
            onDelete={() => deleteAccountMutation.mutate()}
          />
        </OpsSectionCard>
        <OpsSectionCard title={t("sessionsTitle")} description={t("sessionsDescription")}>
          <ActiveSessionsPanel
            sessions={sessionsQuery.data ?? []}
            loading={sessionsQuery.isLoading}
            pendingSessionId={revokeSessionMutation.variables?.id}
            revokingAll={revokeAllSessionsMutation.isPending}
            onRevoke={(session) => {
              void confirm({
                title: t("revokeSessionConfirmTitle"),
                description: t("revokeSessionConfirmDescription"),
                confirmText: t("logoutSession"),
                cancelText: t("cancel"),
                confirmVariant: "danger"
              }).then((confirmed) => {
                if (confirmed) revokeSessionMutation.mutate({ id: session.id });
              });
            }}
            onRevokeAll={() => {
              void confirm({
                title: t("logoutAllConfirmTitle"),
                description: t("logoutAllConfirmDescription"),
                confirmText: t("logoutAllSessions"),
                cancelText: t("cancel"),
                confirmVariant: "danger"
              }).then((confirmed) => {
                if (confirmed) revokeAllSessionsMutation.mutate();
              });
            }}
          />
        </OpsSectionCard>
        <OpsSectionCard title={t("securityActivityTitle")} description={t("securityActivityDescription")}>
          <SecurityActivityPanel
            activities={securityActivityQuery.data ?? []}
            loading={securityActivityQuery.isLoading}
          />
        </OpsSectionCard>
      </Box>

      <Box ref={profileSectionRef}>
        <OpsSectionCard title={t("profileTitle")} description={t("profileDescription")}>
          <EmailChangeForm
            email={emailDraft}
            pending={emailChangeMutation.isPending}
            onEmailChange={setEmailDraft}
            onSubmit={() => emailChangeMutation.mutate(emailDraft)}
          />
          {profileProvider === "local" ? (
            <TwoFactorPanel
              enabled={twoFactorQuery.data?.enabled === true}
              setup={twoFactorSetup}
              recoveryCodes={recoveryCodes}
              setupPending={twoFactorSetupMutation.isPending}
              actionPending={twoFactorConfirmMutation.isPending || twoFactorDisableMutation.isPending}
              recoveryCodePending={recoveryCodeRegenerationMutation.isPending}
              setupCancelPending={twoFactorSetupCancelMutation.isPending}
              onSetup={() => twoFactorSetupMutation.mutate()}
              onConfirm={(code) => twoFactorConfirmMutation.mutate(code)}
              onDisable={(code) => twoFactorDisableMutation.mutate(code)}
              onRegenerate={(code) => recoveryCodeRegenerationMutation.mutate(code)}
              onCancelSetup={() => twoFactorSetupCancelMutation.mutate()}
            />
          ) : null}
          <ProfileSecurityForm
            profileProvider={profileProvider}
            avatarColor={avatarColor}
            profileControl={profileForm.control}
            passwordControl={passwordForm.control}
            newPasswordValue={passwordForm.watch("newPassword")}
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
        <>
          <OpsSectionCard title={t("securitySummaryTitle")} description={t("securitySummaryDescription")}>
            <AdminSecuritySummaryPanel
              summary={securitySummaryQuery.data}
              loading={securitySummaryQuery.isLoading}
            />
            <Box className="mt-4">
              <AdminSecurityNotificationPanel
                data={securityNotificationsQuery.data}
                loading={securityNotificationsQuery.isLoading}
                pendingId={markSecurityNotificationMutation.variables}
                onSelect={(notification) => {
                  setSelectedSecurityEventId(notification.eventId);
                  if (!notification.readAt) markSecurityNotificationMutation.mutate(notification.id);
                }}
              />
            </Box>
            <Box className="mt-4">
              <AdminSecurityEventReviewPanel
                events={securityEventsQuery.data?.items ?? []}
                totalCount={securityEventsQuery.data?.totalCount ?? 0}
                page={securityEventsQuery.data?.page ?? securityEventPage}
                pageSize={securityEventsQuery.data?.pageSize ?? 10}
                loading={securityEventsQuery.isLoading}
                reviewStatus={securityEventStatus}
                severity={securityEventSeverity}
                assigneeFilter={securityEventAssignee}
                selectedEvent={
                  securityEventsQuery.data?.items.find((event) => event.id === selectedSecurityEventId) ??
                  securityEventDetailsQuery.data
                }
                details={securityEventDetailsQuery.data}
                detailsLoading={securityEventDetailsQuery.isLoading}
                selectedEventIds={selectedSecurityEventIds}
                pending={reviewSecurityEventMutation.isPending}
                bulkPending={bulkReviewSecurityEventsMutation.isPending}
                onReviewStatusChange={(value) => {
                  setSecurityEventStatus(value);
                  setSecurityEventPage(1);
                  setSelectedSecurityEventIds([]);
                }}
                onSeverityChange={(value) => {
                  setSecurityEventSeverity(value);
                  setSecurityEventPage(1);
                  setSelectedSecurityEventIds([]);
                }}
                onAssigneeFilterChange={(value) => {
                  setSecurityEventAssignee(value);
                  setSecurityEventPage(1);
                  setSelectedSecurityEventIds([]);
                }}
                onPageChange={(nextPage) => {
                  setSecurityEventPage(nextPage);
                  setSelectedSecurityEventIds([]);
                }}
                onSelect={(event) => setSelectedSecurityEventId(event.id)}
                onToggleSelection={(eventId) =>
                  setSelectedSecurityEventIds((current) =>
                    current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId]
                  )
                }
                onToggleAll={(checked) =>
                  setSelectedSecurityEventIds(
                    checked ? (securityEventsQuery.data?.items ?? []).map((event) => event.id) : []
                  )
                }
                onSave={(eventId, input) => reviewSecurityEventMutation.mutate({ eventId, input })}
                onBulkSave={(input) =>
                  bulkReviewSecurityEventsMutation.mutate({ eventIds: selectedSecurityEventIds, ...input })
                }
              />
            </Box>
          </OpsSectionCard>
          <OpsSectionCard title={t("usersTitle")} description={t("usersDescription")}>
            <AdminInvitationPanel
              invitations={invitationsQuery.data ?? []}
              email={inviteEmail}
              role={inviteRole}
              pending={inviteUserMutation.isPending}
              pendingInvitationId={resendInvitationMutation.variables ?? revokeInvitationMutation.variables}
              inviteLink={inviteLink}
              deliverySent={inviteDeliverySent}
              onEmailChange={setInviteEmail}
              onRoleChange={setInviteRole}
              onInvite={() => inviteUserMutation.mutate()}
              onResend={(invitation) => resendInvitationMutation.mutate(invitation.id)}
              onRevoke={(invitation) => {
                void confirm({
                  title: t("revokeInviteTitle"),
                  description: t("revokeInviteDescription"),
                  confirmText: t("revokeInviteAction"),
                  cancelText: t("cancel"),
                  confirmVariant: "danger"
                }).then((confirmed) => {
                  if (confirmed) revokeInvitationMutation.mutate(invitation.id);
                });
              }}
            />
            <UserManagementPanel
              users={usersQuery.data?.items ?? []}
              totalCount={usersQuery.data?.totalCount ?? 0}
              page={usersQuery.data?.page ?? userPage}
              pageSize={usersQuery.data?.pageSize ?? 20}
              search={userSearch}
              roleFilter={userRoleFilter}
              statusFilter={userStatusFilter}
              currentUserId={authSession.user.id}
              isLoading={usersQuery.isLoading}
              pendingUserId={updateUserMutation.variables?.userId}
              onSearchChange={(value) => {
                setUserSearch(value);
                setUserPage(1);
              }}
              onRoleFilterChange={(value) => {
                setUserRoleFilter(value);
                setUserPage(1);
              }}
              onStatusFilterChange={(value) => {
                setUserStatusFilter(value);
                setUserPage(1);
              }}
              onPageChange={setUserPage}
              selectedUserId={selectedUserId}
              userDetails={userDetailsQuery.data}
              userDetailsLoading={userDetailsQuery.isLoading}
              onSelectUser={setSelectedUserId}
              onCloseDetails={() => setSelectedUserId(undefined)}
              activity={userActivityQuery.data}
              activityLoading={userActivityQuery.isLoading}
              activityAction={activityAction}
              activityFrom={activityFrom}
              activityTo={activityTo}
              activityPage={activityPage}
              onActivityActionChange={(value) => {
                setActivityAction(value);
                setActivityPage(1);
              }}
              onActivityFromChange={(value) => {
                setActivityFrom(value);
                setActivityPage(1);
              }}
              onActivityToChange={(value) => {
                setActivityTo(value);
                setActivityPage(1);
              }}
              onActivityPageChange={setActivityPage}
              onExportActivity={async () => {
                if (!selectedUserId) return;
                const csv = await exportOpslensUserActivityCsv(authSession!.accessToken, selectedUserId, {
                  action: activityAction,
                  from: activityFrom ? new Date(`${activityFrom}T00:00:00.000Z`).toISOString() : undefined,
                  to: activityTo ? new Date(`${activityTo}T23:59:59.999Z`).toISOString() : undefined
                });
                const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
                const link = document.createElement("a");
                link.href = url;
                link.download = `user-activity-${selectedUserId}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              sessionPendingId={revokeUserSessionMutation.variables?.sessionId}
              onRevokeUserSession={(sessionId) => {
                if (!selectedUserId) return;
                void promptConfirm({
                  title: t("userSessionRevokeTitle"),
                  description: t("userSessionRevokeDescription"),
                  confirmText: t("logoutSession"),
                  cancelText: t("cancel"),
                  confirmVariant: "danger",
                  inputLabel: t("adminReasonLabel"),
                  inputPlaceholder: t("adminReasonPlaceholder"),
                  inputRequired: true,
                  trimResult: true,
                  validator: (value) => (value.trim().length < 2 ? t("adminReasonRequired") : null)
                }).then((reason) => {
                  if (reason) revokeUserSessionMutation.mutate({ userId: selectedUserId, sessionId, reason });
                });
              }}
              bulkPending={bulkUpdateUsersMutation.isPending || bulkRevokeUserSessionsMutation.isPending}
              onBulkUpdate={(userIds, isActive) => {
                void promptConfirm({
                  title: t("bulkUserStatusTitle"),
                  description: t("bulkUserStatusDescription", { count: userIds.length }),
                  confirmText: isActive ? tUsers("bulkActivate") : tUsers("bulkDeactivate"),
                  cancelText: t("cancel"),
                  confirmVariant: isActive ? "primary" : "danger",
                  inputLabel: t("adminReasonLabel"),
                  inputPlaceholder: t("adminReasonPlaceholder"),
                  inputRequired: true,
                  trimResult: true,
                  validator: (value) => (value.trim().length < 2 ? t("adminReasonRequired") : null)
                }).then((reason) => {
                  if (reason) bulkUpdateUsersMutation.mutate({ userIds, isActive, reason });
                });
              }}
              onBulkForceLogout={(userIds) => {
                void promptConfirm({
                  title: t("bulkUserSessionsRevokeTitle"),
                  description: t("bulkUserSessionsRevokeDescription", { count: userIds.length }),
                  confirmText: t("logoutAllSessions"),
                  cancelText: t("cancel"),
                  confirmVariant: "danger",
                  inputLabel: t("adminReasonLabel"),
                  inputPlaceholder: t("adminReasonPlaceholder"),
                  inputRequired: true,
                  trimResult: true,
                  validator: (value) => (value.trim().length < 2 ? t("adminReasonRequired") : null)
                }).then((reason) => {
                  if (reason) bulkRevokeUserSessionsMutation.mutate({ userIds, reason });
                });
              }}
              onUpdate={(user, input) => {
                void promptConfirm({
                  title: t("userStatusReasonTitle"),
                  description: t("userStatusReasonDescription"),
                  confirmText: t("confirmAction"),
                  cancelText: t("cancel"),
                  inputLabel: t("adminReasonLabel"),
                  inputPlaceholder: t("adminReasonPlaceholder"),
                  inputRequired: true,
                  trimResult: true,
                  validator: (value) => (value.trim().length < 2 ? t("adminReasonRequired") : null)
                }).then((reason) => {
                  if (reason) updateUserMutation.mutate({ userId: user.id, input: { ...input, reason } });
                });
              }}
              onForceLogout={(user) => {
                void promptConfirm({
                  title: t("userSessionsRevokeTitle"),
                  description: t("userSessionsRevokeDescription"),
                  confirmText: t("logoutAllSessions"),
                  cancelText: t("cancel"),
                  confirmVariant: "danger",
                  inputLabel: t("adminReasonLabel"),
                  inputPlaceholder: t("adminReasonPlaceholder"),
                  inputRequired: true,
                  trimResult: true,
                  validator: (value) => (value.trim().length < 2 ? t("adminReasonRequired") : null)
                }).then((reason) => {
                  if (reason) revokeUserSessionsMutation.mutate({ userId: user.id, reason });
                });
              }}
            />
          </OpsSectionCard>
        </>
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
