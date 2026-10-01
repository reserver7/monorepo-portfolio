"use client";

import { useEffect, useState } from "react";
import { Box, Button, confirm, FormField, Input, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import type { TwoFactorSetup } from "@/lib/auth";
import { formatRecoveryCodes } from "@/lib/auth/two-factor-ux";

type TwoFactorPanelProps = {
  enabled: boolean;
  setup: TwoFactorSetup | null;
  recoveryCodes: string[] | null;
  setupPending: boolean;
  actionPending: boolean;
  recoveryCodePending: boolean;
  setupCancelPending: boolean;
  onSetup: () => void;
  onConfirm: (code: string) => void;
  onDisable: (code: string) => void;
  onRegenerate: (code: string) => void;
  onCancelSetup: () => void;
};

export function TwoFactorPanel({
  enabled,
  setup,
  recoveryCodes,
  setupPending,
  actionPending,
  recoveryCodePending,
  setupCancelPending,
  onSetup,
  onConfirm,
  onDisable,
  onRegenerate,
  onCancelSetup
}: TwoFactorPanelProps) {
  const t = useTranslations("settings.profile");
  const [disableCode, setDisableCode] = useState("");
  const [regenerateCode, setRegenerateCode] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [copied, setCopied] = useState<"secret" | "codes" | null>(null);
  useEffect(() => {
    if (!setup) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [setup]);
  const copyText = async (value: string, target: "secret" | "codes") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
    } catch {
      setCopied(null);
    }
  };
  const copyRecoveryCodes = async () => {
    if (!recoveryCodes) return;
    await copyText(formatRecoveryCodes(recoveryCodes), "codes");
  };
  const downloadRecoveryCodes = () => {
    if (!recoveryCodes) return;
    const url = URL.createObjectURL(new Blob([formatRecoveryCodes(recoveryCodes)], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "opslens-recovery-codes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const confirmDisable = async () => {
    const confirmed = await confirm({
      title: t("disableTwoFactorConfirmTitle"),
      description: t("disableTwoFactorConfirmDescription"),
      confirmText: t("disableTwoFactorConfirmAction"),
      cancelText: t("cancelAction"),
      confirmVariant: "danger"
    });
    if (confirmed) onDisable(disableCode);
  };
  const confirmRegenerate = async () => {
    const confirmed = await confirm({
      title: t("regenerateRecoveryCodesConfirmTitle"),
      description: t("regenerateRecoveryCodesConfirmDescription"),
      confirmText: t("regenerateRecoveryCodesConfirmAction"),
      cancelText: t("cancelAction"),
      confirmVariant: "danger"
    });
    if (confirmed) onRegenerate(regenerateCode);
  };
  const confirmCancelSetup = async () => {
    const confirmed = await confirm({
      title: t("cancelTwoFactorSetupConfirmTitle"),
      description: t("cancelTwoFactorSetupConfirmDescription"),
      confirmText: t("cancelTwoFactorSetupConfirmAction"),
      cancelText: t("cancelAction"),
      confirmVariant: "danger"
    });
    if (confirmed) onCancelSetup();
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
              {copied === "codes" ? t("recoveryCodesCopied") : t("copyRecoveryCodes")}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={downloadRecoveryCodes}>
              {t("downloadRecoveryCodes")}
            </Button>
          </Box>
        </Box>
      ) : enabled ? (
        <Box className="mt-3 grid gap-4">
          <Box className="flex flex-col gap-3 md:flex-row md:items-end">
            <Box className="min-w-0 flex-1">
              <FormField label={t("twoFactorCode")} htmlFor="two-factor-disable-code">
                <Input
                  id="two-factor-disable-code"
                  value={disableCode}
                  inputMode="numeric"
                  onChange={(event) => setDisableCode(event.target.value)}
                />
              </FormField>
            </Box>
            <Button variant="danger" loading={actionPending} onClick={() => void confirmDisable()}>
              {t("disableTwoFactor")}
            </Button>
          </Box>
          <Box className="border-default grid gap-2 rounded-[var(--radius-md)] border p-3">
            <Typography as="p" variant="bodySm" className="font-semibold">
              {t("regenerateRecoveryCodesTitle")}
            </Typography>
            <Typography as="p" variant="caption" color="muted">
              {t("regenerateRecoveryCodesDescription")}
            </Typography>
            <Box className="flex flex-col gap-3 md:flex-row md:items-end">
              <Box className="min-w-0 flex-1">
                <FormField label={t("twoFactorCode")} htmlFor="two-factor-regenerate-code">
                  <Input
                    id="two-factor-regenerate-code"
                    inputMode="numeric"
                    value={regenerateCode}
                    onChange={(event) => setRegenerateCode(event.target.value)}
                  />
                </FormField>
              </Box>
              <Button
                variant="secondary"
                loading={recoveryCodePending}
                onClick={() => void confirmRegenerate()}
              >
                {t("regenerateRecoveryCodes")}
              </Button>
            </Box>
          </Box>
        </Box>
      ) : setup ? (
        <Box className="mt-3 grid gap-3">
          <Typography as="p" variant="caption" color="muted">
            {t("twoFactorSetupStepOne")}
          </Typography>
          <Typography as="p" variant="caption" color="muted">
            {t("twoFactorSetupExpiry")}
          </Typography>
          {setup.otpauthUri ? (
            <Box className="flex justify-center rounded-[var(--radius-md)] bg-white p-4">
              <QRCodeSVG
                value={setup.otpauthUri}
                size={192}
                level="M"
                marginSize={4}
                title={t("twoFactorQrCode")}
              />
            </Box>
          ) : null}
          <Typography as="p" variant="caption" color="muted">
            {t("twoFactorSetupStepTwo")}
          </Typography>
          <Box className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Typography as="p" variant="bodySm" className="min-w-0 flex-1 break-all font-mono">
              {setup.secret}
            </Typography>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void copyText(setup.secret ?? "", "secret")}
              disabled={!setup.secret}
            >
              {copied === "secret" ? t("recoveryCodesCopied") : t("copyTwoFactorSecret")}
            </Button>
          </Box>
          <Typography as="p" variant="caption" color="muted">
            {t("twoFactorSetupStepThree")}
          </Typography>
          <Box className="flex flex-col gap-3 md:flex-row md:items-end">
            <Box className="min-w-0 flex-1">
              <FormField label={t("twoFactorCode")} htmlFor="two-factor-confirm-code">
                <Input
                  id="two-factor-confirm-code"
                  value={setupCode}
                  inputMode="numeric"
                  onChange={(event) => setSetupCode(event.target.value)}
                />
              </FormField>
            </Box>
            <Button loading={actionPending} onClick={() => onConfirm(setupCode)}>
              {t("enableTwoFactor")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              loading={setupCancelPending}
              onClick={() => void confirmCancelSetup()}
            >
              {t("cancelTwoFactorSetup")}
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
