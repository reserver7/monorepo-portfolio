"use client";

import { FeedbackState } from "@/features/common/components/feedback-state";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Box, Button } from "@repo/ui";

export default function RootError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box className="bg-background flex min-h-screen items-center justify-center p-[var(--space-4)]">
      <Box className="w-full max-w-2xl">
        <FeedbackState
          variant="error"
          size="lg"
          align="center"
          title={t("loadFailedTitle")}
          description={t("retryDescription")}
          action={<Button onClick={reset}>{t("retry")}</Button>}
        />
      </Box>
    </Box>
  );
}
