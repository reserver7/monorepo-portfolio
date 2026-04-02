"use client";

import { useMemo, useState } from "react";
import { Button, Skeleton, StateView, Textarea } from "@repo/ui";
import { useQuery } from "@repo/react-query";
import { getAiBriefing, getDashboardSummary, listIssues } from "@/features/ops/api";
import { OpsCardListSkeleton, OpsSectionCard, SeverityBadge, StatusBadge } from "@/features/ops";
import { useOpsFilters } from "@/features/ops/stores";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { opslensQueryKeys, toOptionalSearch, toOptionalServiceName } from "@/features/ops/api";

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
    <div className="space-y-6">
      <OpsSectionCard
        title="AI 브리핑"
        description="운영/개발/기획이 같은 맥락으로 이슈를 이해할 수 있도록 브리핑을 자동 생성합니다."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
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
          </div>
        </div>

        {briefingQuery.isLoading ? (
          <div className="border-default bg-surface-elevated mt-3 space-y-2 rounded-xl border p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : briefingQuery.isError ? (
          <StateView variant="error" size="sm" title="브리핑 생성에 실패했습니다." className="mt-3" />
        ) : (
          <div className="border-default bg-surface-elevated mt-3 rounded-xl border p-4">
            <p className="text-foreground whitespace-pre-wrap text-sm leading-6">{briefingQuery.data}</p>
          </div>
        )}
      </OpsSectionCard>

      <section className="grid gap-6 xl:grid-cols-2">
        <OpsSectionCard
          title="리포트 포맷 (Slack/Jira 공유용)"
          description="아래 문구를 그대로 공유하면 운영 정렬이 빠르게 됩니다."
        >
          <Textarea
            readOnly
            value={reportText}
            rows={10}
            className="bg-surface-elevated mt-3 font-mono text-xs"
          />
        </OpsSectionCard>

        <OpsSectionCard title="우선 대응 이슈 TOP 5">
          {issuesQuery.isLoading ? (
            <OpsCardListSkeleton count={5} />
          ) : issuesQuery.isError ? (
            <StateView variant="error" size="sm" title="이슈 조회에 실패했습니다." className="mt-3" />
          ) : (issuesQuery.data?.items.length ?? 0) === 0 ? (
            <StateView variant="empty" size="sm" title="대상 이슈가 없습니다." className="mt-3" />
          ) : (
            <div className="mt-3 space-y-2">
              {issuesQuery.data?.items.map((issue) => (
                <div key={issue.id} className="border-default rounded-lg border p-3 text-sm">
                  <p className="text-foreground font-semibold">{issue.title}</p>
                  <div className="text-muted mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <SeverityBadge severity={issue.severity} />
                    <StatusBadge status={issue.status} />
                    <span>{issue.serviceName}</span>
                    <span>·</span>
                    <span>{formatNumber(issue.occurrenceCount)}회</span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    최근 발생: {formatDateTime(issue.lastOccurredAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </OpsSectionCard>
      </section>

      {summaryQuery.isLoading ? (
        <StateView
          variant="loading"
          size="sm"
          className="border-default bg-surface rounded-xl border p-4"
          title="대시보드 요약 데이터를 갱신하는 중입니다."
        />
      ) : null}
    </div>
  );
}
