"use client";

import { useMemo, useState } from "react";
import { Box, Button, Flex, SplitWorkspaceLayout, StateView, Skeleton, Textarea } from "@repo/ui";
import { useQuery } from "@repo/react-query";
import { getAiBriefing, getDashboardSummary, listIssues } from "@repo/opslens";
import { OpsCardListSkeleton, OpsPageShell, OpsSectionCard, SeverityBadge, StatusBadge } from "@/features";
import { useOpsFilters } from "@/features/stores";
import { formatDateTime, formatNumber } from "@repo/utils";
import { opslensQueryKeys, toOptionalSearch, toOptionalServiceName } from "@repo/opslens";

export default function ReportsPage() {
  const { environment, serviceName, search, from, to } = useOpsFilters();
  const filter = { environment, serviceName, search, from, to };

  const [audience, setAudience] = useState<"developer" | "stakeholder">("developer");

  const summaryQuery = useQuery({
    queryKey: opslensQueryKeys.reportsSummary(filter),
    staleTime: 10 * 1000,
    queryFn: () =>
      getDashboardSummary({
        environment,
        serviceName: toOptionalServiceName(serviceName),
        query: toOptionalSearch(search),
        from,
        to
      })
  });

  const briefingQuery = useQuery({
    queryKey: opslensQueryKeys.reportsBriefing(filter),
    staleTime: 10 * 1000,
    queryFn: () =>
      getAiBriefing({
        environment,
        serviceName: toOptionalServiceName(serviceName),
        query: toOptionalSearch(search),
        from,
        to
      })
  });

  const issuesQuery = useQuery({
    queryKey: opslensQueryKeys.reportsIssues(filter),
    staleTime: 10 * 1000,
    queryFn: () =>
      listIssues({
        environment,
        serviceName: toOptionalServiceName(serviceName),
        query: toOptionalSearch(search),
        page: 1,
        pageSize: 5
      })
  });

  const reportText = useMemo(() => {
    const summary = summaryQuery.data;
    const issues = issuesQuery.data?.items ?? [];

    if (!summary) return "";

    const topSeverity = [...summary.severityDistribution].sort((a, b) => b.count - a.count)[0];
    const topIssue = issues[0];

    if (audience === "developer") {
      return [
        `[${environment}] 운영 리포트`,
        `- 오늘 이슈 수: ${summary.todayIssueCount}`,
        `- 가장 큰 비중 심각도: ${topSeverity?.severity ?? "n/a"} (${topSeverity?.count ?? 0})`,
        `- 배포 이후 신규 증가: ${summary.newAfterLatestDeployment.length}`,
        topIssue
          ? `- 우선 대응 이슈: ${topIssue.title} (횟수 ${topIssue.occurrenceCount})`
          : "- 우선 대응 이슈: 없음",
        "- 상세: /issues 화면에서 상태 전환 및 담당자 지정"
      ].join("\n");
    }

    return [
      `[${environment}] 운영 브리핑`,
      `오늘 주요 이슈는 ${summary.todayIssueCount}건입니다.`,
      `현재 우선 확인이 필요한 심각도는 ${topSeverity?.severity ?? "n/a"} 입니다.`,
      `배포 이후 신규 증가 이슈는 ${summary.newAfterLatestDeployment.length}건입니다.`,
      topIssue ? `최우선 확인 대상: ${topIssue.title}` : "최우선 확인 대상: 없음"
    ].join("\n");
  }, [audience, environment, issuesQuery.data?.items, summaryQuery.data]);

  return (
    <OpsPageShell>
      <SplitWorkspaceLayout
        sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_360px]"
        main={
          <Box className="space-y-[var(--stack-gap)]">
            <OpsSectionCard
              title="AI 브리핑"
              description="운영/개발/기획이 같은 맥락으로 이슈를 이해하도록 요약합니다."
            >
              <Flex className="flex-wrap items-center justify-between gap-[var(--space-3)]">
                <Flex className="items-center gap-[var(--space-2)] text-sm">
                  <Button
                    type="button"
                    variant={audience === "developer" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setAudience("developer")}
                  >
                    개발자용
                  </Button>
                  <Button
                    type="button"
                    variant={audience === "stakeholder" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setAudience("stakeholder")}
                  >
                    비개발자용
                  </Button>
                </Flex>
              </Flex>

              {briefingQuery.isLoading ? (
                <Box className="border-default bg-surface-elevated mt-[var(--space-3)] space-y-[var(--space-2)] rounded-xl border p-[var(--space-4)]">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-4/5" />
                </Box>
              ) : briefingQuery.isError ? (
                <StateView variant="error" size="sm" title="브리핑 생성에 실패했습니다." className="mt-[var(--space-3)]" />
              ) : (
                <Box className="border-default bg-surface-elevated mt-[var(--space-3)] rounded-xl border p-[var(--space-4)]">
                  <Box as="p" className="text-foreground whitespace-pre-wrap text-sm leading-6">{briefingQuery.data}</Box>
                </Box>
              )}
            </OpsSectionCard>

            <OpsSectionCard
              title="리포트 포맷 (Slack/Jira 공유용)"
              description="아래 문구를 그대로 공유하면 운영 정렬이 빨라집니다."
            >
              <Textarea
                readOnly
                value={reportText}
                rows={10}
                className="bg-surface-elevated mt-[var(--space-3)] font-mono text-caption"
              />
            </OpsSectionCard>
          </Box>
        }
        sidebar={
          <OpsSectionCard title="우선 대응 이슈 TOP 5">
            {issuesQuery.isLoading ? (
              <OpsCardListSkeleton count={5} />
            ) : issuesQuery.isError ? (
              <StateView variant="error" size="sm" title="이슈 조회에 실패했습니다." className="mt-[var(--space-3)]" />
            ) : (issuesQuery.data?.items.length ?? 0) === 0 ? (
              <StateView variant="empty" size="sm" title="대상 이슈가 없습니다." className="mt-[var(--space-3)]" />
            ) : (
              <Box className="mt-[var(--space-3)] space-y-[var(--space-2)]">
                {issuesQuery.data?.items.map((issue) => (
                  <Box key={issue.id} className="border-default bg-surface-elevated rounded-xl border p-[var(--space-3)] text-sm">
                    <Box as="p" className="text-foreground font-semibold">{issue.title}</Box>
                    <Flex className="text-muted mt-[var(--space-1)] flex-wrap items-center gap-[var(--space-2)] text-caption">
                      <SeverityBadge severity={issue.severity} />
                      <StatusBadge status={issue.status} />
                      <Box as="span">{issue.serviceName}</Box>
                      <Box as="span">·</Box>
                      <Box as="span">{formatNumber(issue.occurrenceCount)}회</Box>
                    </Flex>
                    <Box as="p" className="text-muted-foreground mt-[var(--space-1)] text-caption">
                      최근 발생: {formatDateTime(issue.lastOccurredAt)}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </OpsSectionCard>
        }
      />

      {summaryQuery.isLoading ? (
        <StateView
          variant="loading"
          size="sm"
          className="border-default bg-surface rounded-xl border p-[var(--space-4)]"
          title="대시보드 요약 데이터를 갱신하는 중입니다."
        />
      ) : null}
    </OpsPageShell>
  );
}
