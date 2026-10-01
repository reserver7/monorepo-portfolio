"use client";

import { Box, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";

export function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations("auth");
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;
  const level = score <= 1 ? "weak" : score <= 2 ? "medium" : "strong";
  const strengthMessage = {
    weak: "passwordStrengthWeak",
    medium: "passwordStrengthMedium",
    strong: "passwordStrengthStrong"
  } as const;
  const width = level === "weak" ? "w-1/3" : level === "medium" ? "w-2/3" : "w-full";
  const tone = level === "weak" ? "bg-danger" : level === "medium" ? "bg-warning" : "bg-success";

  return (
    <Box className="mt-2" aria-live="polite">
      <Box className="bg-surface-elevated h-1.5 overflow-hidden rounded-full">
        <Box className={`h-full ${width} ${tone}`} />
      </Box>
      <Typography as="p" variant="caption" color="muted" className="mt-1">
        {t(strengthMessage[level])}
      </Typography>
    </Box>
  );
}
