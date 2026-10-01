"use client";

import { useMemo, useState } from "react";
import { Box, Button, FormField, Input, Select, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";
import type { AuthRole, OpsAdminInvitation } from "@repo/opslens";

type AdminInvitationPanelProps = {
  invitations: OpsAdminInvitation[];
  email: string;
  role: AuthRole;
  pending: boolean;
  pendingInvitationId?: string;
  inviteLink?: string;
  deliverySent?: boolean;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: AuthRole) => void;
  onInvite: () => void;
  onResend: (invitation: OpsAdminInvitation) => void;
  onRevoke: (invitation: OpsAdminInvitation) => void;
};

export function AdminInvitationPanel({
  invitations,
  email,
  role,
  pending,
  pendingInvitationId,
  inviteLink,
  deliverySent,
  onEmailChange,
  onRoleChange,
  onInvite,
  onResend,
  onRevoke
}: AdminInvitationPanelProps) {
  const t = useTranslations("settings.users");
  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | AuthRole>("all");
  const roleOptions = [
    { label: t("admin"), value: "admin" },
    { label: t("operator"), value: "operator" },
    { label: t("viewer"), value: "viewer" }
  ];
  const filterOptions = [{ label: t("allRoles"), value: "all" }, ...roleOptions];
  const filteredInvitations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return invitations.filter((invitation) => {
      const matchesQuery = !normalizedQuery || invitation.email.toLowerCase().includes(normalizedQuery);
      const matchesRole = filterRole === "all" || invitation.role === filterRole;
      return matchesQuery && matchesRole;
    });
  }, [filterRole, invitations, query]);

  const formatExpiry = (value: string): string =>
    new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return (
    <Box className="border-default bg-surface mb-4 rounded-[var(--radius-md)] border p-4">
      <Typography as="h3" variant="headingMd">
        {t("inviteTitle")}
      </Typography>
      <Typography as="p" variant="bodySm" color="muted" className="mt-1">
        {t("inviteDescription")}
      </Typography>
      <Box className="mt-3 grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
        <FormField label={t("inviteEmail")} htmlFor="admin-invite-email">
          <Input
            id="admin-invite-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            autoComplete="email"
            spellCheck={false}
          />
        </FormField>
        <Box>
          <Typography as="label" variant="bodySm" className="mb-1 block">
            {t("inviteRole")}
          </Typography>
          <Select
            value={role}
            options={roleOptions}
            onChange={(value) => onRoleChange(String(value) as AuthRole)}
          />
        </Box>
        <Button type="button" loading={pending} disabled={!email.trim()} onClick={onInvite}>
          {t("invite")}
        </Button>
      </Box>
      {inviteLink ? (
        <Box
          className="border-success/30 bg-success/5 mt-4 rounded-[var(--radius-md)] border p-3"
          aria-live="polite"
        >
          <Typography as="p" variant="bodySm" className="font-semibold">
            {deliverySent ? t("inviteDeliverySent") : t("inviteDeliveryUnavailable")}
          </Typography>
          <Box className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Typography as="p" variant="caption" color="muted" className="min-w-0 break-all">
              {inviteLink}
            </Typography>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(inviteLink)}
            >
              {t("copyInviteLink")}
            </Button>
          </Box>
        </Box>
      ) : null}
      {invitations.length > 0 ? (
        <Box className="divide-default border-default mt-4 divide-y border-y">
          <Box className="grid gap-2 border-b p-3 sm:grid-cols-[1fr_180px]">
            <Input
              aria-label={t("searchInvites")}
              placeholder={t("searchInvites")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
            <Select
              aria-label={t("filterRole")}
              value={filterRole}
              options={filterOptions}
              onChange={(value) => setFilterRole(String(value) as "all" | AuthRole)}
            />
          </Box>
          {filteredInvitations.map((invitation) => (
            <Box key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <Box>
                <Typography as="p" variant="bodySm" className="font-semibold">
                  {invitation.email}
                </Typography>
                <Typography as="p" variant="caption" color="muted">
                  {t(invitation.role)} · {t("expiresAt", { date: formatExpiry(invitation.expiresAt) })}
                </Typography>
              </Box>
              <Box className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  loading={pendingInvitationId === invitation.id}
                  onClick={() => onResend(invitation)}
                >
                  {t("resendInvite")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pendingInvitationId === invitation.id}
                  onClick={() => onRevoke(invitation)}
                >
                  {t("revokeInvite")}
                </Button>
              </Box>
            </Box>
          ))}
          {filteredInvitations.length === 0 ? (
            <Typography as="p" variant="bodySm" color="muted" className="p-3">
              {t("noMatchingInvites")}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
