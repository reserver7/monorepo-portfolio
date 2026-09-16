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
          className="hover:bg-surface-elevated active:bg-surface h-[var(--size-control-md)] w-[var(--size-control-md)] rounded-full border-transparent bg-transparent p-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label={tCommon("profileMenu")}
        >
          <Avatar size="sm" name={userName} status="online" color={avatarColor} bordered={false} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px]">
        <DropdownMenuLabel>
          <Box className="grid gap-[2px]">
            <Typography as="p" className="text-foreground text-sm font-semibold leading-none">
              {userName}
            </Typography>
            <Typography as="p" className="text-muted text-xs leading-none">
              {userEmail}
            </Typography>
            <Typography as="p" className="text-muted text-[11px] uppercase leading-none">
              {userRole}
            </Typography>
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
          {tProfile("myIssues")}
        </DropdownMenuItem>
        <DropdownMenuItem
          leftSlot={<Bell className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
          onSelect={onMoveToNotifications}
        >
          {tProfile("myNotifications")}
        </DropdownMenuItem>
        <DropdownMenuItem
          leftSlot={<Zap className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
          rightSlot={
            focusModeEnabled ? (
              <Check className="h-[var(--size-icon-sm)] w-[var(--size-icon-sm)]" />
            ) : undefined
          }
          onSelect={onToggleFocusMode}
        >
          {tProfile("focusMode")}
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
          {tProfile("auditLog")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          leftSlot={<LogOut className="text-danger h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
          color="danger"
          onSelect={onLogout}
        >
          {tProfile("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
