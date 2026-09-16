"use client";

import { FeedbackState } from "@/features/common/components/feedback-state";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("error");
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <FeedbackState variant="loading" title={t("loadingTitle")} description={t("loadingDescription")} />
    </main>
  );
}
