import { Grid } from "@repo/ui";
import { useLocale, useTranslations } from "next-intl";
import { MetricCard } from "@/features/common/components/feedback-state";
import { formatNumber } from "@repo/utils";

import { ISSUE_TONE } from "../constants";

type IssuesSummaryCardsProps = {
  summary: {
    open: number;
    criticalHigh: number;
    unassigned: number;
    slaRisk: number;
  };
};

const STAT_CARD_CLASS =
  "h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:text-[11px]";

export function IssuesSummaryCards({ summary }: IssuesSummaryCardsProps) {
  const t = useTranslations("issues.summary");
  const locale = useLocale();
  return (
    <Grid className="mb-[var(--space-3)] grid-cols-2 gap-[var(--space-2)] md:grid-cols-4">
      <MetricCard
        label={t("open")}
        value={formatNumber(summary.open, locale)}
        helper={t("openHelper")}
        size="md"
        className={STAT_CARD_CLASS}
      />
      <MetricCard
        label={t("criticalHigh")}
        value={formatNumber(summary.criticalHigh, locale)}
        helper={t("criticalHighHelper")}
        color={ISSUE_TONE.criticalHigh}
        size="md"
        className={STAT_CARD_CLASS}
      />
      <MetricCard
        label={t("unassigned")}
        value={formatNumber(summary.unassigned, locale)}
        helper={t("unassignedHelper")}
        color={ISSUE_TONE.unassigned}
        size="md"
        className={STAT_CARD_CLASS}
      />
      <MetricCard
        label={t("slaRisk")}
        value={formatNumber(summary.slaRisk, locale)}
        helper={t("slaRiskHelper")}
        color={ISSUE_TONE.slaRisk}
        size="md"
        className={STAT_CARD_CLASS}
      />
    </Grid>
  );
}
