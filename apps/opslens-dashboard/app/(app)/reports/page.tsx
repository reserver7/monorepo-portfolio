"use client";

import { useMemo, useState } from "react";
import { Button, Textarea } from "@repo/ui";
import { useQuery } from "@repo/react-query";
import { getAiBriefing, getDashboardSummary, listIssues } from "@/lib/api";
import { OpsSectionCard } from "@/components/opslens";
import { useOpsFilterStore } from "@/lib/store";
import { formatDateTime, formatNumber } from "@/lib/utils";

export default function ReportsPage() {
  const environment = useOpsFilterStore((state) => state.environment);
  const serviceName = useOpsFilterStore((state) => state.serviceName);
  const search = useOpsFilterStore((state) => state.search);
  const from = useOpsFilterStore((state) => state.from);
  const to = useOpsFilterStore((state) => state.to);

  const [audience, setAudience] = useState<"developer" | "stakeholder">("developer");

  const summaryQuery = useQuery({
    queryKey: ["opslens", "reports", "summary", environment, serviceName, search, from, to],
    queryFn: () => getDashboardSummary({ environment, serviceName, query: search, from, to })
  });

  const briefingQuery = useQuery({
    queryKey: ["opslens", "reports", "briefing", environment, serviceName, search, from, to],
    queryFn: () => getAiBriefing({ environment, serviceName, query: search, from, to })
  });

  const issuesQuery = useQuery({
    queryKey: ["opslens", "reports", "issues", environment, serviceName, search],
    queryFn: () =>
      listIssues({
        environment,
        serviceName,
        query: search || undefined,
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
        topIssue ? `- 우선 대응 이슈: ${topIssue.title} (횟수 ${topIssue.occurrenceCount})` : "- 우선 대응 이슈: 없음",
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
    <div className="space-y-5">
      <OpsSectionCard title="AI 브리핑" description="운영/개발/기획이 같은 맥락으로 이슈를 이해할 수 있도록 브리핑을 자동 생성합니다.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Button
              type="button"
              variant={audience === "developer" ? "default" : "outline"}
              size="sm"
              onClick={() => setAudience("developer")}
            >
              개발자용
            </Button>
            <Button
              type="button"
              variant={audience === "stakeholder" ? "default" : "outline"}
              size="sm"
              onClick={() => setAudience("stakeholder")}
            >
              비개발자용
            </Button>
          </div>
        </div>

        {briefingQuery.isLoading ? (
          <p className="mt-3 text-sm text-muted">브리핑 생성 중...</p>
        ) : briefingQuery.isError ? (
          <p className="mt-3 text-sm text-danger">브리핑 생성에 실패했습니다.</p>
        ) : (
          <div className="mt-3 rounded-xl border border-default bg-surface-elevated p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{briefingQuery.data}</p>
          </div>
        )}
      </OpsSectionCard>

      <section className="grid gap-5 xl:grid-cols-2">
        <OpsSectionCard title="리포트 포맷 (Slack/Jira 공유용)" description="아래 문구를 그대로 공유하면 운영 정렬이 빠르게 됩니다.">
          <Textarea
            readOnly
            value={reportText}
            rows={10}
            className="mt-3 bg-surface-elevated font-mono text-xs"
          />
        </OpsSectionCard>

        <OpsSectionCard title="우선 대응 이슈 TOP 5">

          {issuesQuery.isLoading ? (
            <p className="mt-3 text-sm text-muted">이슈를 불러오는 중...</p>
          ) : issuesQuery.isError ? (
            <p className="mt-3 text-sm text-danger">이슈 조회에 실패했습니다.</p>
          ) : (issuesQuery.data?.items.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-muted">대상 이슈가 없습니다.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {issuesQuery.data?.items.map((issue) => (
                <div key={issue.id} className="rounded-lg border border-default p-3 text-sm">
                  <p className="font-semibold text-foreground">{issue.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {issue.severity} · {issue.status} · {issue.serviceName} · {formatNumber(issue.occurrenceCount)}회
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">최근 발생: {formatDateTime(issue.lastOccurredAt)}</p>
                </div>
              ))}
            </div>
          )}
        </OpsSectionCard>
      </section>
    </div>
  );
}
