"use client";

import { useEffect, useState } from "react";
import { FeedbackState } from "@/features/common/components/feedback-state";
import { useTranslations } from "next-intl";

import type { AuthRole, OpsAuthUser, OpsAuthUserActivity, OpsAuthUserDetails } from "@repo/opslens";
import { Badge, Box, Button, Checkbox, Flex, Input, Select, toast, Typography } from "@repo/ui";
import { OpsSectionSkeleton } from "@/features";

export function UserManagementPanel({
  users,
  totalCount,
  page,
  pageSize,
  search,
  roleFilter,
  statusFilter,
  currentUserId,
  isLoading,
  pendingUserId,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onPageChange,
  onBulkUpdate,
  onBulkForceLogout,
  bulkPending,
  selectedUserId,
  userDetails,
  userDetailsLoading,
  onSelectUser,
  onCloseDetails,
  sessionPendingId,
  onRevokeUserSession,
  activity,
  activityLoading,
  activityAction,
  activityFrom,
  activityTo,
  activityPage,
  onActivityActionChange,
  onActivityFromChange,
  onActivityToChange,
  onActivityPageChange,
  onExportActivity,
  onUpdate,
  onForceLogout
}: {
  users: OpsAuthUser[];
  totalCount: number;
  page: number;
  pageSize: number;
  search: string;
  roleFilter: AuthRole | "all";
  statusFilter: "all" | "active" | "inactive";
  currentUserId?: string;
  isLoading: boolean;
  pendingUserId?: string;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: AuthRole | "all") => void;
  onStatusFilterChange: (value: "all" | "active" | "inactive") => void;
  onPageChange: (page: number) => void;
  onBulkUpdate: (userIds: string[], isActive: boolean) => void;
  onBulkForceLogout: (userIds: string[]) => void;
  bulkPending: boolean;
  selectedUserId?: string;
  userDetails?: OpsAuthUserDetails;
  userDetailsLoading: boolean;
  onSelectUser: (userId: string) => void;
  onCloseDetails: () => void;
  sessionPendingId?: string;
  onRevokeUserSession: (sessionId: string) => void;
  activity?: OpsAuthUserActivity;
  activityLoading: boolean;
  activityAction: string;
  activityFrom: string;
  activityTo: string;
  activityPage: number;
  onActivityActionChange: (value: string) => void;
  onActivityFromChange: (value: string) => void;
  onActivityToChange: (value: string) => void;
  onActivityPageChange: (page: number) => void;
  onExportActivity: () => void | Promise<void>;
  onUpdate: (user: OpsAuthUser, input: { role?: AuthRole; isActive?: boolean }) => void;
  onForceLogout: (user: OpsAuthUser) => void;
}) {
  const t = useTranslations("settings.users");
  const roleOptions = [
    { label: t("allRoles"), value: "all" },
    { label: t("admin"), value: "admin" },
    { label: t("operator"), value: "operator" },
    { label: t("viewer"), value: "viewer" }
  ];
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const selectableUsers = users.filter((user) => user.id !== currentUserId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>();
  const selectedOnPage = selectableUsers.filter((user) => selectedIds.includes(user.id));
  const allSelected = selectableUsers.length > 0 && selectedOnPage.length === selectableUsers.length;
  const selectedActivity = activity?.items.find((item) => item.id === selectedActivityId);
  const selectedActivityValues = selectedActivity
    ? [
        { label: t("beforeValue"), value: selectedActivity.beforeValue },
        { label: t("afterValue"), value: selectedActivity.afterValue },
        { label: t("metadata"), value: selectedActivity.metadata }
      ]
    : [];

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => selectableUsers.some((user) => user.id === id)));
  }, [users, currentUserId]);

  useEffect(() => {
    if (selectedActivityId && !activity?.items.some((item) => item.id === selectedActivityId)) {
      setSelectedActivityId(undefined);
    }
  }, [activity, selectedActivityId]);

  const toggleSelected = (userId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, userId])] : current.filter((id) => id !== userId)
    );
  };

  if (isLoading) return <OpsSectionSkeleton rows={4} />;

  return (
    <Box>
      <Flex className="flex-wrap items-end gap-[var(--space-2)] pb-[var(--space-3)]">
        <Input
          value={search}
          placeholder={t("searchPlaceholder")}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Select
          value={roleFilter}
          options={roleOptions}
          onChange={(value) => onRoleFilterChange(String(value) as AuthRole | "all")}
        />
        <Select
          value={statusFilter}
          options={[
            { label: t("allStatuses"), value: "all" },
            { label: t("active"), value: "active" },
            { label: t("inactive"), value: "inactive" }
          ]}
          onChange={(value) => onStatusFilterChange(String(value) as "all" | "active" | "inactive")}
        />
      </Flex>
      <Typography as="p" variant="caption" color="muted" className="pb-[var(--space-2)]">
        {t("resultCount", { count: totalCount })}
      </Typography>
      {selectableUsers.length > 0 ? (
        <Flex className="items-center justify-between gap-[var(--space-2)] pb-[var(--space-3)]">
          <Checkbox
            size="sm"
            label={t("selectAll")}
            checked={allSelected}
            indeterminate={selectedOnPage.length > 0 && !allSelected}
            onCheckedChange={(checked) =>
              setSelectedIds(checked ? selectableUsers.map((user) => user.id) : [])
            }
          />
          {selectedIds.length > 0 ? (
            <Flex className="flex-wrap items-center gap-[var(--space-2)]">
              <Typography as="span" variant="caption" color="muted">
                {t("selectedCount", { count: selectedIds.length })}
              </Typography>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={bulkPending}
                onClick={() => {
                  onBulkUpdate(selectedIds, true);
                  setSelectedIds([]);
                }}
              >
                {t("bulkActivate")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={bulkPending}
                onClick={() => {
                  onBulkUpdate(selectedIds, false);
                  setSelectedIds([]);
                }}
              >
                {t("bulkDeactivate")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={bulkPending}
                onClick={() => {
                  onBulkForceLogout(selectedIds);
                  setSelectedIds([]);
                }}
              >
                {t("bulkLogoutAll")}
              </Button>
            </Flex>
          ) : null}
        </Flex>
      ) : null}
      {users.length === 0 ? (
        <FeedbackState
          variant="empty"
          size="sm"
          title={search || roleFilter !== "all" || statusFilter !== "all" ? t("noMatchingUsers") : t("empty")}
        />
      ) : (
        <Box className="divide-default border-default divide-y border-y">
          {users.map((user) => (
            <Flex
              key={user.id}
              className="flex-wrap items-center justify-between gap-[var(--space-3)] py-[var(--space-3)]"
            >
              <Box className="min-w-0">
                <Flex className="items-center gap-[var(--space-2)]">
                  {user.id === currentUserId ? null : (
                    <Checkbox
                      size="sm"
                      aria-label={user.email}
                      checked={selectedIds.includes(user.id)}
                      onCheckedChange={(checked) => toggleSelected(user.id, checked)}
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto min-h-0 p-0 font-semibold"
                    onClick={() => onSelectUser(user.id)}
                  >
                    {user.name}
                  </Button>
                </Flex>
                <Typography as="p" variant="caption" color="muted">
                  {user.email}
                </Typography>
              </Box>
              <Flex className="items-center gap-[var(--space-2)]">
                <Badge
                  variant={
                    user.id === currentUserId ? "secondary" : user.role === "admin" ? "warning" : "outline"
                  }
                  size="sm"
                >
                  {user.id === currentUserId ? "내 계정" : user.authProvider}
                </Badge>
                <Select
                  value={user.role}
                  options={roleOptions.slice(1)}
                  size="sm"
                  disabled={pendingUserId === user.id}
                  onChange={(value) => onUpdate(user, { role: String(value) as AuthRole })}
                />
                <Button
                  type="button"
                  variant={user.isActive === false ? "secondary" : "outline"}
                  size="sm"
                  disabled={pendingUserId === user.id || user.id === currentUserId}
                  loading={pendingUserId === user.id}
                  onClick={() => onUpdate(user, { isActive: user.isActive === false })}
                >
                  {user.isActive === false ? "활성화" : "비활성화"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pendingUserId === user.id || user.id === currentUserId || user.isActive === false}
                  onClick={() => onForceLogout(user)}
                >
                  {t("logoutAll")}
                </Button>
              </Flex>
            </Flex>
          ))}
        </Box>
      )}
      {selectedUserId ? (
        <Box className="border-default bg-surface-elevated mt-[var(--space-4)] rounded-[var(--radius-md)] border p-[var(--space-4)]">
          <Flex className="items-start justify-between gap-[var(--space-3)]">
            <Box>
              <Typography as="h3" variant="bodySm" className="font-semibold">
                {userDetails?.user.name ?? t("detailsTitle")}
              </Typography>
              {userDetails ? (
                <Typography as="p" variant="caption" color="muted">
                  {userDetails.user.email}
                </Typography>
              ) : null}
            </Box>
            <Button type="button" variant="ghost" size="sm" onClick={onCloseDetails}>
              {t("closeDetails")}
            </Button>
          </Flex>
          {userDetailsLoading ? (
            <Typography as="p" variant="bodySm" color="muted" className="pt-[var(--space-3)]">
              {t("detailsLoading")}
            </Typography>
          ) : userDetails ? (
            <Box className="pt-[var(--space-3)]">
              <Flex className="flex-wrap gap-[var(--space-4)]">
                <Box>
                  <Typography as="p" variant="caption" color="muted">
                    {t("createdAt")}
                  </Typography>
                  <Typography as="p" variant="bodySm">
                    {new Date(userDetails.user.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography as="p" variant="caption" color="muted">
                    {t("lastLogin")}
                  </Typography>
                  <Typography as="p" variant="bodySm">
                    {userDetails.lastLoginAt
                      ? new Date(userDetails.lastLoginAt).toLocaleString()
                      : t("notAvailable")}
                  </Typography>
                </Box>
                <Box>
                  <Typography as="p" variant="caption" color="muted">
                    {t("lastPasswordChange")}
                  </Typography>
                  <Typography as="p" variant="bodySm">
                    {userDetails.lastPasswordChangedAt
                      ? new Date(userDetails.lastPasswordChangedAt).toLocaleString()
                      : t("notAvailable")}
                  </Typography>
                </Box>
                <Box>
                  <Typography as="p" variant="caption" color="muted">
                    {t("activeSessionCount")}
                  </Typography>
                  <Typography as="p" variant="bodySm">
                    {userDetails.activeSessionCount}
                  </Typography>
                </Box>
              </Flex>
              <Typography
                as="p"
                variant="caption"
                color="muted"
                className="pb-[var(--space-2)] pt-[var(--space-4)]"
              >
                {t("activeSessions")}
              </Typography>
              {userDetails.sessions.length === 0 ? (
                <Typography as="p" variant="bodySm" color="muted">
                  {t("noActiveSessions")}
                </Typography>
              ) : (
                <Box className="divide-default border-default divide-y border-y">
                  {userDetails.sessions.map((session) => (
                    <Flex
                      key={session.id}
                      className="items-center justify-between gap-[var(--space-3)] py-[var(--space-2)]"
                    >
                      <Box className="min-w-0">
                        <Typography as="p" variant="bodySm">
                          {session.userAgent || t("unknownDevice")}
                        </Typography>
                        <Typography as="p" variant="caption" color="muted">
                          {session.ipAddress || t("unknownIp")} ·{" "}
                          {new Date(session.lastUsedAt ?? session.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={sessionPendingId === session.id}
                        disabled={Boolean(sessionPendingId)}
                        onClick={() => onRevokeUserSession(session.id)}
                      >
                        {t("logoutSession")}
                      </Button>
                    </Flex>
                  ))}
                </Box>
              )}
              <Flex className="flex-wrap items-end justify-between gap-[var(--space-2)] pt-[var(--space-4)]">
                <Select
                  value={activityAction}
                  options={[
                    { label: t("allActivity"), value: "all" },
                    { label: t("loginActivity"), value: "auth.login" },
                    { label: t("passwordActivity"), value: "auth.password_changed" },
                    { label: t("sessionActivity"), value: "auth.user_session_revoked" },
                    { label: t("roleActivity"), value: "user.updated" }
                  ]}
                  onChange={(value) => onActivityActionChange(String(value))}
                />
                <Input
                  type="date"
                  value={activityFrom}
                  onChange={(event) => onActivityFromChange(event.target.value)}
                />
                <Input
                  type="date"
                  value={activityTo}
                  onChange={(event) => onActivityToChange(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={activityLoading}
                  onClick={() => void onExportActivity()}
                >
                  {t("exportActivity")}
                </Button>
              </Flex>
              <Typography
                as="p"
                variant="caption"
                color="muted"
                className="pb-[var(--space-2)] pt-[var(--space-3)]"
              >
                {t("recentActivityCount", { count: activity?.totalCount ?? 0 })}
              </Typography>
              {activityLoading ? (
                <Typography as="p" variant="bodySm" color="muted">
                  {t("detailsLoading")}
                </Typography>
              ) : !activity?.items.length ? (
                <Typography as="p" variant="bodySm" color="muted">
                  {t("noActivity")}
                </Typography>
              ) : (
                <Box className="divide-default border-default divide-y border-y">
                  {activity.items.map((item) => (
                    <Flex
                      key={item.id}
                      className="items-center justify-between gap-[var(--space-3)] py-[var(--space-2)]"
                    >
                      <Box className="min-w-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto min-h-0 p-0 text-left"
                          onClick={() => setSelectedActivityId(item.id)}
                        >
                          {item.summary}
                        </Button>
                        <Typography as="p" variant="caption" color="muted">
                          {item.action}
                        </Typography>
                      </Box>
                      <Typography as="span" variant="caption" color="muted">
                        {new Date(item.createdAt).toLocaleString()}
                      </Typography>
                    </Flex>
                  ))}
                </Box>
              )}
              {selectedActivity ? (
                <Box className="border-default bg-surface mt-[var(--space-3)] rounded-[var(--radius-md)] border p-[var(--space-3)]">
                  <Flex className="items-start justify-between gap-[var(--space-3)]">
                    <Box>
                      <Typography as="p" variant="bodySm" className="font-semibold">
                        {t("activityDetails")}
                      </Typography>
                      <Typography as="p" variant="caption" color="muted">
                        {selectedActivity.action} · {new Date(selectedActivity.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard
                          .writeText(JSON.stringify(selectedActivity, null, 2))
                          .then(() => toast.success(t("activityCopied")))
                          .catch(() => toast.error(t("activityCopyFailed")));
                      }}
                    >
                      {t("copyActivity")}
                    </Button>
                  </Flex>
                  <Flex className="flex-wrap gap-[var(--space-3)] pt-[var(--space-3)]">
                    <Typography as="p" variant="caption" color="muted">
                      {t("actor")}: {selectedActivity.actor}
                    </Typography>
                    <Typography as="p" variant="caption" color="muted">
                      {t("target")}: {selectedActivity.targetType}:{selectedActivity.targetId ?? "-"}
                    </Typography>
                  </Flex>
                  <Box className="grid gap-[var(--space-3)] pt-[var(--space-3)] md:grid-cols-3">
                    {selectedActivityValues.map(({ label, value }) => (
                      <Box key={label}>
                        <Typography as="p" variant="caption" color="muted" className="pb-[var(--space-1)]">
                          {label}
                        </Typography>
                        <Typography
                          as="p"
                          variant="caption"
                          className="bg-surface-elevated whitespace-pre-wrap break-words rounded-[var(--radius-sm)] p-[var(--space-2)] font-mono"
                        >
                          {JSON.stringify(value ?? null, null, 2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : null}
              {activity && activity.totalCount > activity.pageSize ? (
                <Flex className="items-center justify-between pt-[var(--space-2)]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={activityPage <= 1}
                    onClick={() => onActivityPageChange(activityPage - 1)}
                  >
                    {t("previousPage")}
                  </Button>
                  <Typography as="span" variant="caption" color="muted">
                    {t("pageInfo", {
                      page: activityPage,
                      totalPages: Math.ceil(activity.totalCount / activity.pageSize)
                    })}
                  </Typography>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={activityPage >= Math.ceil(activity.totalCount / activity.pageSize)}
                    onClick={() => onActivityPageChange(activityPage + 1)}
                  >
                    {t("nextPage")}
                  </Button>
                </Flex>
              ) : null}
            </Box>
          ) : null}
        </Box>
      ) : null}
      {totalPages > 1 ? (
        <Flex className="items-center justify-between pt-[var(--space-3)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {t("previousPage")}
          </Button>
          <Typography as="span" variant="caption" color="muted">
            {t("pageInfo", { page, totalPages })}
          </Typography>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {t("nextPage")}
          </Button>
        </Flex>
      ) : null}
    </Box>
  );
}
