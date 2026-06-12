import { Grid, StatCard } from "@repo/ui";
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
  return (
    <Grid className="mb-[var(--space-3)] grid-cols-2 gap-[var(--space-2)] md:grid-cols-4">
      <StatCard label="Open Issues" value={formatNumber(summary.open)} helper="현재 미해결 이슈" size="md" className={STAT_CARD_CLASS} />
      <StatCard
        label="Critical / High"
        value={formatNumber(summary.criticalHigh)}
        helper="우선 대응 대상"
        color={ISSUE_TONE.criticalHigh}
        size="md"
        className={STAT_CARD_CLASS}
      />
      <StatCard
        label="Unassigned"
        value={formatNumber(summary.unassigned)}
        helper="담당자 미지정"
        color={ISSUE_TONE.unassigned}
        size="md"
        className={STAT_CARD_CLASS}
      />
      <StatCard
        label="SLA Risk"
        value={formatNumber(summary.slaRisk)}
        helper="지연 임계치 초과"
        color={ISSUE_TONE.slaRisk}
        size="md"
        className={STAT_CARD_CLASS}
      />
    </Grid>
  );
}
