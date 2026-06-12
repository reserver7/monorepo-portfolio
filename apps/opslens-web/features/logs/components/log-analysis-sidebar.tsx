import { Box, Badge, Button, ConsoleSectionCard, Flex, StateView, StatCard, Typography } from "@repo/ui";
import { formatDateTime, formatNumber } from "@repo/utils";

import { LOGS_SEVERITY_VARIANT_MAP } from "../constants";
import type { LogsCluster } from "../types";

type LogAnalysisSidebarProps = {
  selectedCluster: LogsCluster | null;
  summary: { createdIssues: number; updatedIssues: number } | null;
  onCreateIssue: () => void;
};

export function LogAnalysisSidebar({ selectedCluster, summary, onCreateIssue }: LogAnalysisSidebarProps) {
  if (!summary) {
    return <StateView variant="info" size="sm" title="로그를 분석하면 요약 카드가 표시됩니다." />;
  }

  return (
    <Box className="space-y-[var(--space-3)]">
      <StatCard
        label="신규 이슈 생성"
        value={`${formatNumber(summary.createdIssues)}건`}
        helper="새로 생성된 항목"
        color="success"
        size="sm"
        className="rounded-[var(--radius-lg)]"
      />
      <StatCard
        label="기존 이슈 업데이트"
        value={`${formatNumber(summary.updatedIssues)}건`}
        helper="기존 항목에 반영"
        color="warning"
        size="sm"
        className="rounded-[var(--radius-lg)]"
      />
      {selectedCluster ? (
        <ConsoleSectionCard title="선택 클러스터 상세" description="우선 처리 대상을 빠르게 확인합니다." contentClassName="pt-[var(--space-2)]">
          <Box className="space-y-[var(--space-2)]">
            <Flex className="items-center justify-between gap-[var(--space-2)]">
              <Badge variant={LOGS_SEVERITY_VARIANT_MAP[selectedCluster.severity]} size="sm">{selectedCluster.severity}</Badge>
              <Badge variant="secondary" size="sm">{formatNumber(selectedCluster.count)}건</Badge>
            </Flex>
            <Typography as="p" variant="bodySm" className="font-semibold">{selectedCluster.title}</Typography>
            <Typography as="p" variant="caption" color="muted">{selectedCluster.normalizedMessage}</Typography>
            <Typography as="p" variant="caption" color="subtle">
              최초 {formatDateTime(selectedCluster.firstSeen)} · 최근 {formatDateTime(selectedCluster.lastSeen)}
            </Typography>
            <Button type="button" size="sm" variant="outline" onClick={onCreateIssue}>
              이슈 생성
            </Button>
          </Box>
        </ConsoleSectionCard>
      ) : null}
    </Box>
  );
}
