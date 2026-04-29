"use client";

import { useTranslations } from "next-intl";
import { LogOut, Settings, UserCircle2 } from "lucide-react";
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
  onMoveToSettings: () => void;
  onLogout: () => void;
};

export function ProfileMenu({
  userName,
  userEmail,
  userRole,
  avatarColor = "#64748B",
  onMoveToSettings,
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
      <DropdownMenuContent align="end" className="w-[220px]">
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
          onSelect={onMoveToSettings}
        >
          {tProfile("myProfile")}
        </DropdownMenuItem>
        <DropdownMenuItem
          leftSlot={<Settings className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
          onSelect={onMoveToSettings}
        >
          {tProfile("workspaceSettings")}
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
