"use client";

import { FeedbackState } from "@/features/common/components/feedback-state";
import { useLocale, useTranslations } from "next-intl";

import { Badge, Box, Flex, Grid, Typography } from "@repo/ui";
import { formatDateTime, formatNumber } from "@repo/utils";
import { OpsSectionCard } from "@/features";
import { QA_AUDIENCE_LABELS, QA_NEUTRAL_BADGE_CLASS, QA_STATUS_BADGE_CLASS } from "../constants";
import type { QaAudience, QaScenarioItem } from "../types";

type QaScenarioDetailProps = {
  scenario: QaScenarioItem | null;
};

export function QaScenarioDetail({ scenario }: QaScenarioDetailProps) {
  const t = useTranslations("qa.detail");
  const locale = useLocale();
  if (!scenario) {
    return (
      <OpsSectionCard title={t("title")} description={t("emptyDescription")}>
        <FeedbackState variant="info" size="sm" title={t("empty")} className="mt-[var(--space-3)]" />
      </OpsSectionCard>
    );
  }

  const riskVariant =
    scenario.riskPoints.length >= 3 ? "danger" : scenario.riskPoints.length > 0 ? "warning" : "success";

  return (
    <OpsSectionCard title={t("title")} description={t("description")} contentClassName="pt-[var(--space-2)]">
      <Box className="space-y-[var(--space-4)]">
        <Box className="border-default border-b pb-[var(--space-3)]">
          <Flex className="items-start justify-between gap-[var(--space-3)]">
            <Box className="min-w-0">
              <Typography as="p" variant="bodyMd" className="font-semibold">
                {scenario.featureName}
              </Typography>
              <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-1)]">
                {t("createdAt", { value: formatDateTime(scenario.createdAt, locale) })}
              </Typography>
            </Box>
            <Flex className="flex-wrap justify-end gap-[var(--space-1-5)]">
              <Badge variant="secondary" size="sm" shape="rounded" className={QA_NEUTRAL_BADGE_CLASS}>
                {QA_AUDIENCE_LABELS[scenario.audience as QaAudience] ?? scenario.audience}
              </Badge>
            </Flex>
          </Flex>
        </Box>

        <ResultList
          title={t("riskPoints")}
          description={t("riskDescription")}
          badgeVariant={riskVariant}
          items={scenario.riskPoints}
          priority
        />

        <Grid className="gap-[var(--space-4)] lg:grid-cols-2">
          <ResultList
            title={t("testCases")}
            description={t("testCasesDescription")}
            badgeVariant="secondary"
            items={scenario.generatedCases}
          />
          <ResultList
            title={t("regression")}
            description={t("regressionDescription")}
            badgeVariant="secondary"
            items={scenario.regressionTargets}
          />
        </Grid>
      </Box>
    </OpsSectionCard>
  );
}

function ResultList({
  title,
  description,
  badgeVariant,
  items,
  priority = false
}: {
  title: string;
  description: string;
  badgeVariant: "secondary" | "warning" | "danger" | "success";
  items: string[];
  priority?: boolean;
}) {
  const locale = useLocale();
  return (
    <Box className={priority ? "border-default min-w-0 border-b pb-[var(--space-4)]" : "min-w-0"}>
      <Flex className="items-center justify-between gap-[var(--space-2)]">
        <Box className="min-w-0">
          <Typography as="p" variant="bodySm" className="font-semibold">
            {title}
          </Typography>
          <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-0-5)]">
            {description}
          </Typography>
        </Box>
        <Badge
          variant={badgeVariant}
          size="sm"
          shape="rounded"
          className={badgeVariant === "secondary" ? QA_NEUTRAL_BADGE_CLASS : QA_STATUS_BADGE_CLASS}
        >
          {formatNumber(items.length, locale)}
        </Badge>
      </Flex>
      <Box className="mt-[var(--space-3)] space-y-[var(--space-2)]">
        {items.map((item, index) => (
          <Box key={`${title}-${item}`}>
            <Flex className="items-start gap-[var(--space-2)]">
              <Typography
                as="span"
                variant="caption"
                color="subtle"
                className="w-[var(--space-5)] shrink-0 text-right font-semibold tabular-nums"
              >
                {index + 1}
              </Typography>
              <Typography as="p" variant="caption" className="text-foreground/85">
                {item}
              </Typography>
            </Flex>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
