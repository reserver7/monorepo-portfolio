"use client";

import { FeedbackState } from "@/features/common/components/feedback-state";

import type { AuthRole, OpsAuthUser } from "@repo/opslens";
import { Badge, Box, Button, Flex, Select, Typography } from "@repo/ui";
import { OpsSectionSkeleton } from "@/features";

import type { AuthRole, OpsAuthUser } from "@repo/opslens";
import { Badge, Box, Button, Flex, Select, Typography } from "@repo/ui";
import { OpsSectionSkeleton } from "@/features";

export function UserManagementPanel({
  users,
  currentUserId,
  isLoading,
  pendingUserId,
  onUpdate
}: {
  users: OpsAuthUser[];
  currentUserId?: string;
  isLoading: boolean;
  pendingUserId?: string;
  onUpdate: (user: OpsAuthUser, input: { role?: AuthRole; isActive?: boolean }) => void;
}) {
  const t = useTranslations("settings.users");
  const roleOptions = [
    { label: t("admin"), value: "admin" },
    { label: t("operator"), value: "operator" },
    { label: t("viewer"), value: "viewer" }
  ];
  if (isLoading) return <OpsSectionSkeleton rows={4} />;
  if (users.length === 0) return <FeedbackState variant="empty" size="sm" title="등록된 사용자가 없습니다." />;

  return (
    <Box className="divide-default border-default divide-y border-y">
      {users.map((user) => (
        <Flex
          key={user.id}
          className="flex-wrap items-center justify-between gap-[var(--space-3)] py-[var(--space-3)]"
        >
          <Box className="min-w-0">
            <Typography as="p" variant="bodySm" className="font-semibold">
              {user.name}
            </Typography>
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
              options={roleOptions}
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
          </Flex>
        </Flex>
      ))}
    </Box>
  );
}
