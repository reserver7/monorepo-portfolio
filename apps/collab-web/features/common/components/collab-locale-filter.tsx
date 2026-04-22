"use client";

import { useTranslations } from "next-intl";
import { Box, Select } from "@repo/ui";
import type { CollabLocale } from "@/lib/i18n/messages";
import { useCollabLocaleStore } from "@/features/stores";

export function CollabLocaleFilter() {
  const t = useTranslations("collab.locale");
  const locale = useCollabLocaleStore((state) => state.locale);
  const setLocale = useCollabLocaleStore((state) => state.setLocale);

  return (
    <Box className="w-[116px]">
      <Select
        value={locale}
        onChange={(value) => setLocale(String(value) as CollabLocale)}
        placeholder={t("placeholder")}
        options={[
          { value: "ko", label: t("options.ko") },
          { value: "en", label: t("options.en") },
          { value: "ja", label: t("options.ja") }
        ]}
        size="sm"
      />
    </Box>
  );
}
