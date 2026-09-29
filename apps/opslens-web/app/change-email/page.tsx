"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Box, Button, Typography } from "@repo/ui";

export default function ChangeEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("settings.screen");
  const tAuth = useTranslations("auth");
  const [message, setMessage] = useState(t("emailChangeChecking"));

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setMessage(t("emailChangeInvalid"));
      return;
    }
    void fetch(`/api/opslens-auth/confirm-email-change?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = (await response.json()) as { email?: string; message?: string };
        if (!response.ok) throw new Error(payload.message || t("emailChangeInvalid"));
        setMessage(t("emailChangeComplete", { email: payload.email ?? "" }));
        window.setTimeout(() => router.replace("/login"), 900);
      })
      .catch((error: Error) => setMessage(error.message || t("emailChangeInvalid")));
  }, [router, searchParams, t]);

  return (
    <Box as="main" className="bg-surface-elevated flex min-h-screen items-center justify-center p-6">
      <Box
        as="section"
        className="bg-surface border-default w-full max-w-md rounded-2xl border p-6 shadow-lg"
      >
        <Typography as="h1" variant="headingLg">
          {t("emailChangeTitle")}
        </Typography>
        <Typography as="p" variant="bodyMd" color="muted" className="mt-3">
          {message}
        </Typography>
        <Button className="mt-6" variant="outline" onClick={() => router.replace("/login")}>
          {tAuth("backToLogin")}
        </Button>
      </Box>
    </Box>
  );
}
