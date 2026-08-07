"use client";

import type { AuthRole, OpsAuthUser } from "@repo/opslens";
import { Badge, Box, Button, Flex, Select, StateView, Typography } from "@repo/ui";
import { OpsSectionSkeleton } from "@/features";

const roleOptions = [
  { label: "관리자", value: "admin" },
  { label: "운영자", value: "operator" },
  { label: "조회자", value: "viewer" }
];

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
  if (isLoading) return <OpsSectionSkeleton rows={4} />;
  if (users.length === 0) return <StateView variant="empty" size="sm" title="등록된 사용자가 없습니다." />;

  return (
    <Box className="divide-y divide-default border-y border-default">
      {users.map((user) => (
        <Flex key={user.id} className="flex-wrap items-center justify-between gap-[var(--space-3)] py-[var(--space-3)]">
          <Box className="min-w-0">
            <Typography as="p" variant="bodySm" className="font-semibold">{user.name}</Typography>
            <Typography as="p" variant="caption" color="muted">{user.email}</Typography>
          </Box>
          <Flex className="items-center gap-[var(--space-2)]">
            <Badge variant={user.id === currentUserId ? "secondary" : user.role === "admin" ? "warning" : "outline"} size="sm">
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
