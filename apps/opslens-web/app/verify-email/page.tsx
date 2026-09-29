"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const [message, setMessage] = useState(t("verificationChecking"));

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setMessage(t("verificationInvalid"));
      return;
    }

    void fetch(`/api/opslens-auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = (await response.json()) as { next?: string; message?: string };
        if (!response.ok) throw new Error(payload.message || t("verificationInvalid"));
        setMessage(t("verificationComplete"));
        const next = payload.next?.startsWith("/") && !payload.next.startsWith("//") ? payload.next : "/";
        window.setTimeout(() => router.replace(`/login?next=${encodeURIComponent(next)}&verified=1`), 800);
      })
      .catch((error: Error) => setMessage(error.message || t("verificationInvalid")));
  }, [router, searchParams, t]);

  return (
    <Box as="main" className="bg-surface-elevated flex min-h-screen items-center justify-center p-6">
      <Box
        as="section"
        className="bg-surface border-default w-full max-w-md rounded-2xl border p-6 shadow-lg"
      >
        <Typography as="h1" variant="headingLg">
          {t("verificationTitle")}
        </Typography>
        <Typography as="p" variant="bodyMd" color="muted" className="mt-3">
          {message}
        </Typography>
        <Button className="mt-6" variant="outline" onClick={() => router.replace("/login")}>
          {t("backToLogin")}
        </Button>
      </Box>
    </Box>
  );
}
