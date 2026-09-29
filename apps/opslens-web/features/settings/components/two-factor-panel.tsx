"use client";

import { useState } from "react";
import { Box, Button, FormField, Input, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";
import type { TwoFactorSetup } from "@/lib/auth";

type TwoFactorPanelProps = {
  enabled: boolean;
  setup: TwoFactorSetup | null;
  recoveryCodes: string[] | null;
  setupPending: boolean;
  actionPending: boolean;
  onSetup: () => void;
  onConfirm: (code: string) => void;
  onDisable: (code: string) => void;
};

export function TwoFactorPanel({
  enabled,
  setup,
  recoveryCodes,
  setupPending,
  actionPending,
  onSetup,
  onConfirm,
  onDisable
}: TwoFactorPanelProps) {
  const t = useTranslations("settings.profile");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const copyRecoveryCodes = async () => {
    if (!recoveryCodes) return;
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const downloadRecoveryCodes = () => {
    if (!recoveryCodes) return;
    const url = URL.createObjectURL(new Blob([recoveryCodes.join("\n")], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "opslens-recovery-codes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Box className="border-default bg-surface rounded-[var(--radius-md)] border p-4">
      <Typography as="p" variant="bodySm" className="font-semibold">
        {t("twoFactorTitle")}
      </Typography>
      <Typography as="p" variant="caption" color="muted" className="mt-1">
        {enabled ? t("twoFactorEnabled") : t("twoFactorDescription")}
      </Typography>
      {recoveryCodes ? (
        <Box className="mt-3 grid gap-2">
          <Typography as="p" variant="caption" color="muted">
            {t("recoveryCodesDescription")}
          </Typography>
          <Typography as="p" variant="bodySm" className="font-mono tracking-widest">
            {recoveryCodes.join(" · ")}
          </Typography>
          <Box className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void copyRecoveryCodes()}>
              {copied ? t("recoveryCodesCopied") : t("copyRecoveryCodes")}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={downloadRecoveryCodes}>
              {t("downloadRecoveryCodes")}
            </Button>
          </Box>
        </Box>
      ) : enabled ? (
        <Box className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
          <Box className="min-w-0 flex-1">
            <FormField label={t("twoFactorCode")} htmlFor="two-factor-disable-code">
              <Input
                id="two-factor-disable-code"
                value={code}
                inputMode="numeric"
                onChange={(event) => setCode(event.target.value)}
              />
            </FormField>
          </Box>
          <Button variant="danger" loading={actionPending} onClick={() => onDisable(code)}>
            {t("disableTwoFactor")}
          </Button>
        </Box>
      ) : setup ? (
        <Box className="mt-3 grid gap-3">
          <Typography as="p" variant="caption" color="muted" className="break-all">
            {t("twoFactorSecret")}: {setup.secret}
          </Typography>
          <Typography as="p" variant="caption" color="muted" className="break-all">
            {setup.otpauthUri}
          </Typography>
          <Box className="flex flex-col gap-3 md:flex-row md:items-end">
            <Box className="min-w-0 flex-1">
              <FormField label={t("twoFactorCode")} htmlFor="two-factor-confirm-code">
                <Input
                  id="two-factor-confirm-code"
                  value={code}
                  inputMode="numeric"
                  onChange={(event) => setCode(event.target.value)}
                />
              </FormField>
            </Box>
            <Button loading={actionPending} onClick={() => onConfirm(code)}>
              {t("enableTwoFactor")}
            </Button>
          </Box>
        </Box>
      ) : (
        <Button className="mt-3" loading={setupPending} onClick={onSetup}>
          {t("setupTwoFactor")}
        </Button>
      )}
    </Box>
  );
}
