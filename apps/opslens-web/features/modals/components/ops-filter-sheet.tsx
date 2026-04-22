"use client";

import { useMemo } from "react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { Button, DatePicker, Flex, Select, Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, Typography } from "@repo/ui";
import { opslensMessages, type OpsLocale } from "@/lib/i18n/messages";

export type OpsFilterFormValues = {
  environment: "dev" | "stage" | "prod";
  locale: "ko" | "en" | "ja";
  serviceName: string;
  fromDate: string;
  toDate: string;
  search: string;
};

type OpsFilterSheetProps = {
  locale: OpsLocale;
  calendarLocale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: unknown;
  fromDate: string;
  toDate: string;
  onRangeChange: (range: { from?: string; to?: string }) => void;
  onReset: () => void;
  onApply: () => void;
};

export function OpsFilterSheet({
  locale,
  calendarLocale,
  open,
  onOpenChange,
  control,
  fromDate,
  toDate,
  onRangeChange,
  onReset,
  onApply
}: OpsFilterSheetProps) {
  const messages = opslensMessages[locale] ?? opslensMessages.ko;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <FilterSheetContent
          control={control}
          fromDate={fromDate}
          toDate={toDate}
          onRangeChange={onRangeChange}
          onReset={onReset}
          onApply={onApply}
          calendarLocale={calendarLocale}
        />
      </Sheet>
    </NextIntlClientProvider>
  );
}

function FilterSheetContent({
  control,
  fromDate,
  toDate,
  onRangeChange,
  onReset,
  onApply,
  calendarLocale
}: {
  control: unknown;
  fromDate: string;
  toDate: string;
  onRangeChange: (range: { from?: string; to?: string }) => void;
  onReset: () => void;
  onApply: () => void;
  calendarLocale: string;
}) {
  const tFilter = useTranslations("filter");
  const tLocale = useTranslations("locale");
  const tService = useTranslations("service");
  const serviceOptions = useMemo(
    () => ["all", "docs", "whiteboard", "billing", "checkout"].map((value) => ({ label: tService(value), value })),
    [tService]
  );

  return (
    <SheetContent side="right" size="md">
      <SheetHeader>
        <SheetTitle>{tFilter("title")}</SheetTitle>
        <SheetDescription>{tFilter("description")}</SheetDescription>
      </SheetHeader>

      <SheetBody className="space-y-[var(--space-3)]">
        <Flex className="items-center justify-between">
          <Typography as="p" variant="caption" color="muted">
            {tFilter("language")}
          </Typography>
        </Flex>
        <Select
          options={[
            { label: tLocale("ko"), value: "ko" },
            { label: tLocale("en"), value: "en" },
            { label: tLocale("ja"), value: "ja" }
          ]}
          control={control}
          name="locale"
          placeholder={tFilter("selectPlaceholder")}
          size="md"
          className="h-[var(--toolbar-height)]"
        />

        <Flex className="items-center justify-between">
          <Typography as="p" variant="caption" color="muted">
            {tFilter("service")}
          </Typography>
        </Flex>
        <Select
          options={serviceOptions}
          control={control}
          name="serviceName"
          searchable
          placeholder={tFilter("selectPlaceholder")}
          searchPlaceholder={tFilter("selectSearchPlaceholder")}
          emptyMessage={tFilter("selectEmptyMessage")}
          size="md"
          className="h-[var(--toolbar-height)]"
        />

        <Typography as="p" variant="caption" color="muted" className="pt-[var(--space-1)]">
          {tFilter("period")}
        </Typography>
        <DatePicker
          id="filter-period"
          mode="range"
          range={{ from: fromDate, to: toDate }}
          onRangeChange={onRangeChange}
          locale={calendarLocale}
          size="md"
          placeholder={tFilter("selectPeriod")}
          className="bg-surface h-[var(--toolbar-height)] shadow-none focus-visible:ring-0"
        />

        <Flex className="justify-between pt-[var(--space-2)]">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            leftIcon={<RotateCcw />}
            className="border-default text-foreground bg-surface-elevated hover:bg-surface h-[var(--size-control-md)] w-[var(--size-control-md)] rounded-md border p-0"
            aria-label={tFilter("resetFilters")}
            onClick={onReset}
          />
          <Button
            variant="ghost"
            size="sm"
            className="border-default text-foreground bg-surface-elevated hover:bg-surface rounded-md border"
            onClick={onApply}
          >
            {tFilter("apply")}
          </Button>
        </Flex>
      </SheetBody>
    </SheetContent>
  );
}
