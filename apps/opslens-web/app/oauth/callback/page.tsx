"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography, toast } from "@repo/ui";
import { loginWithOAuth, readAuthSession } from "@/lib/auth";

const resolveNextPath = (rawNext: string | null): string => {
  if (!rawNext) return "/";
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith("/")) return "/";
  if (trimmed.startsWith("/login")) return "/";
  if (trimmed.startsWith("/oauth")) return "/";
  return trimmed;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
};

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => resolveNextPath(searchParams.get("next")), [searchParams]);
  const hasStartedLogin = useRef(false);
  const t = useTranslations("auth");

  useEffect(() => {
    const session = readAuthSession();
    if (session?.accessToken) {
      router.replace(nextPath);
      return;
    }

    if (hasStartedLogin.current) return;
    hasStartedLogin.current = true;

    void loginWithOAuth()
      .then(() => {
        toast.success(t("loginSuccess"));
        router.replace(nextPath);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error, t("oauthLoginErrorFallback")));
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      });
  }, [nextPath, router]);

  return (
    <Box className="bg-surface-elevated flex min-h-screen items-center justify-center p-[var(--space-4)]">
      <Box className="grid justify-items-center gap-[var(--space-2)] text-center">
        <Typography as="p" className="text-foreground text-body-lg font-semibold">
          {t("loggingIn")}
        </Typography>
        <Typography as="p" color="muted" className="text-body-sm">
          {t("waitDescription")}
        </Typography>
      </Box>
    </Box>
  );
}
