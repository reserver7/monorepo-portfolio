import { Box, Badge, Button, ConsoleSectionCard, Flex, Typography } from "@repo/ui";
import { useLocale, useTranslations } from "next-intl";
import { FeedbackState, MetricCard } from "@/features/common/components/feedback-state";
import { formatDateTime, formatNumber } from "@repo/utils";

import { LOGS_SEVERITY_VARIANT_MAP } from "../constants";
import type { LogsCluster } from "../types";

type LogAnalysisSidebarProps = {
  selectedCluster: LogsCluster | null;
  summary: { createdIssues: number; updatedIssues: number } | null;
  onCreateIssue: () => void;
};

export function LogAnalysisSidebar({ selectedCluster, summary, onCreateIssue }: LogAnalysisSidebarProps) {
  const locale = useLocale();
  const t = useTranslations("logs");
  if (!summary) {
    return <FeedbackState variant="info" size="sm" title={t("analysis.summaryHint")} />;
  }

  return (
    <Box className="space-y-[var(--space-3)]">
      <MetricCard
        label={t("analysis.createdIssues")}
        value={t("count", { count: formatNumber(summary.createdIssues, locale) })}
        helper={t("analysis.createdHelper")}
        color="success"
        size="sm"
        className="rounded-[var(--radius-lg)]"
      />
      <MetricCard
        label={t("analysis.updatedIssues")}
        value={t("count", { count: formatNumber(summary.updatedIssues, locale) })}
        helper={t("analysis.updatedHelper")}
        color="warning"
        size="sm"
        className="rounded-[var(--radius-lg)]"
      />
      {selectedCluster ? (
        <ConsoleSectionCard
          title={t("analysis.selectedCluster")}
          description={t("analysis.selectedDescription")}
          contentClassName="pt-[var(--space-2)]"
        >
          <Box className="space-y-[var(--space-2)]">
            <Flex className="items-center justify-between gap-[var(--space-2)]">
              <Badge variant={LOGS_SEVERITY_VARIANT_MAP[selectedCluster.severity]} size="sm">
                {selectedCluster.severity}
              </Badge>
              <Badge variant="secondary" size="sm">
                {t("count", { count: formatNumber(selectedCluster.count, locale) })}
              </Badge>
            </Flex>
            <Typography as="p" variant="bodySm" className="font-semibold">
              {selectedCluster.title}
            </Typography>
            <Typography as="p" variant="caption" color="muted">
              {selectedCluster.normalizedMessage}
            </Typography>
            <Typography as="p" variant="caption" color="subtle">
              {t("firstSeen")} {formatDateTime(selectedCluster.firstSeen, locale)} · {t("lastSeen")}{" "}
              {formatDateTime(selectedCluster.lastSeen, locale)}
            </Typography>
            <Button type="button" size="sm" variant="outline" onClick={onCreateIssue}>
              {t("analysis.createIssue")}
            </Button>
          </Box>
        </ConsoleSectionCard>
      ) : null}
    </Box>
  );
}
