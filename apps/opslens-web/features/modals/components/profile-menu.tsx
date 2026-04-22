"use client";

import { useTranslations } from "next-intl";
import { LogOut, Settings, UserCircle2 } from "lucide-react";
import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@repo/ui";
type ProfileMenuProps = {
  onMoveToSettings: () => void;
};

export function ProfileMenu({ onMoveToSettings }: ProfileMenuProps) {
  const tCommon = useTranslations("common");
  const tProfile = useTranslations("profile");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-surface-elevated active:bg-surface-elevated h-[var(--size-control-md)] w-[var(--size-control-md)] rounded-full p-0"
          aria-label={tCommon("profileMenu")}
        >
          <Avatar size="sm" name="Moni Roy" status="online" color="primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel>Moni Roy</DropdownMenuLabel>
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
        >
          {tProfile("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
