"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui";
import { FeedbackState } from "@/features/common/components/feedback-state";

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
    <main className="flex min-h-screen items-center justify-center p-6">
      <FeedbackState
        variant="error"
        title={t("loadFailedTitle")}
        description={t("retryDescription")}
        action={<Button onClick={reset}>{t("retry")}</Button>}
      />
    </main>
  );
}
