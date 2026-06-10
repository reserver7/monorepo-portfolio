"use client";

import { useTranslations } from "next-intl";
import { Bell, Check, ClipboardList, History, LogOut, Settings, UserCircle2, Zap } from "lucide-react";
import {
  Avatar,
  Box,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Typography
} from "@repo/ui";
type ProfileMenuProps = {
  userName: string;
  userEmail: string;
  userRole: string;
  avatarColor?: string;
  focusModeEnabled: boolean;
  onMoveToProfile: () => void;
  onMoveToMyIssues: () => void;
  onMoveToNotifications: () => void;
  onMoveToWorkspace: () => void;
  onMoveToAudit: () => void;
  onToggleFocusMode: () => void;
  onLogout: () => void;
};

export function ProfileMenu({
  userName,
  userEmail,
  userRole,
  avatarColor = "#64748B",
  focusModeEnabled,
  onMoveToProfile,
  onMoveToMyIssues,
  onMoveToNotifications,
  onMoveToWorkspace,
  onMoveToAudit,
  onToggleFocusMode,
  onLogout
}: ProfileMenuProps) {
  const tCommon = useTranslations("common");
  const tProfile = useTranslations("profile");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="h-[var(--size-control-md)] w-[var(--size-control-md)] rounded-full border-transparent bg-transparent p-0 hover:bg-surface-elevated active:bg-surface focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label={tCommon("profileMenu")}
        >
          <Avatar size="sm" name={userName} status="online" color={avatarColor} bordered={false} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px]">
        <DropdownMenuLabel>
          <Box className="grid gap-[2px]">
            <Typography as="p" className="text-foreground text-sm font-semibold leading-none">{userName}</Typography>
            <Typography as="p" className="text-muted text-xs leading-none">{userEmail}</Typography>
            <Typography as="p" className="text-muted text-[11px] leading-none uppercase">{userRole}</Typography>
          </Box>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          leftSlot={<UserCircle2 className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
          onSelect={onMoveToProfile}
        >
          {tProfile("myProfile")}
        </DropdownMenuItem>
        <DropdownMenuItem
          leftSlot={<ClipboardList className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
          onSelect={onMoveToMyIssues}
        >
          내 담당 이슈
        </DropdownMenuItem>
        <DropdownMenuItem
          leftSlot={<Bell className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
          onSelect={onMoveToNotifications}
        >
          내 알림 설정
        </DropdownMenuItem>
        <DropdownMenuItem
          leftSlot={<Zap className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
          rightSlot={focusModeEnabled ? <Check className="h-[var(--size-icon-sm)] w-[var(--size-icon-sm)]" /> : undefined}
          onSelect={onToggleFocusMode}
        >
          운영 집중 모드
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          leftSlot={<Settings className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
          onSelect={onMoveToWorkspace}
        >
          {tProfile("workspaceSettings")}
        </DropdownMenuItem>
        <DropdownMenuItem
          leftSlot={<History className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
          onSelect={onMoveToAudit}
        >
          감사 로그
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          leftSlot={<LogOut className="h-[var(--size-icon-md)] w-[var(--size-icon-md)] text-danger" />}
          color="danger"
          onSelect={onLogout}
        >
          {tProfile("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
