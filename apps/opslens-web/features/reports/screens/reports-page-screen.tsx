"use client";

import { useEffect, useMemo, useState } from "react";
import { Clipboard } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { Badge, Box, Button, Flex, SplitWorkspaceLayout, StateView, Textarea, Typography, confirm, toast } from "@repo/ui";
import {
  deleteReportSnapshot,
  getReportActions,
  getOpsReport,
  getReportSnapshots,
  opslensQueryKeys,
  toOptionalSearch,
  toOptionalServiceName,
  updateReportSnapshot,
  updateReportAction,
  type OpsReportSnapshot
} from "@repo/opslens";
import { OpsPageShell, OpsSectionCard, OpsSectionSkeleton } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsFilters } from "@/features/common/stores";
import { ReportActionList, ReportPriorityIssues, ReportSummaryPanel } from "../components";
import { downloadCsv } from "@/features/common/utils/download-csv";

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const { environment, serviceName, search, from, to } = useOpsFilters();
  const [openActionsOnly, setOpenActionsOnly] = useState(false);
  const filter = { environment, serviceName, search, from, to };

  const reportQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: opslensQueryKeys.opsReport(filter),
      queryFn: () =>
        getOpsReport({
          environment,
          serviceName: toOptionalServiceName(serviceName),
          query: toOptionalSearch(search),
          from,
          to
        })
    })
  );
  const snapshotsQuery = useQuery(
    useOpsQueryOptions("list", {
      queryKey: opslensQueryKeys.reportSnapshots(),
      queryFn: getReportSnapshots
    })
  );

  const report = reportQuery.data;
  const latestSnapshot = snapshotsQuery.data?.[0] ?? null;
  const invalidateSnapshots = async () => {
    await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.reportSnapshots() });
  };
  const updateSnapshotMutation = useMutation({
    mutationFn: updateReportSnapshot,
    onSuccess: invalidateSnapshots
  });
  const actionsQuery = useQuery(
    useOpsQueryOptions("list", {
      queryKey: opslensQueryKeys.reportActions(report?.snapshotId ?? ""),
      queryFn: () => getReportActions(report!.snapshotId),
      enabled: Boolean(report?.snapshotId)
    })
  );
  const updateActionMutation = useMutation({
    mutationFn: updateReportAction,
    onSuccess: async (_action, variables) => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.reportActions(report?.snapshotId ?? "") });
      toast.success(variables.completed ? "액션 아이템을 완료했습니다." : "액션 아이템을 다시 열었습니다.");
    }
  });
  const deleteSnapshotMutation = useMutation({
    mutationFn: ({ snapshotId }: { snapshotId: string }) => deleteReportSnapshot(snapshotId, "web"),
    onSuccess: invalidateSnapshots
  });
  const visibleActions = useMemo(() => (actionsQuery.data ?? []).filter((action) => !openActionsOnly || !action.completedAt), [actionsQuery.data, openActionsOnly]);
  const exportActions = () => downloadCsv(`opslens-report-actions-${new Date().toISOString().slice(0, 10)}.csv`, ["우선순위", "액션", "담당자", "상태", "완료자", "완료 시각"], visibleActions.map((action) => [action.priority, action.title, action.owner, action.completedAt ? "완료" : "진행 필요", action.completedBy, action.completedAt]));

  useEffect(() => {
    if (!report?.generatedAt) return;
    void invalidateSnapshots();
  }, [report?.generatedAt]);

  const copyShareText = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.shareText);
      if (latestSnapshot) {
        updateSnapshotMutation.mutate({ snapshotId: latestSnapshot.id, markShared: true, actor: "web" });
      }
      toast.success("공유용 리포트를 복사했습니다.");
    } catch {
      toast.error("복사에 실패했습니다. 텍스트 영역에서 직접 복사해 주세요.");
    }
  };

  const toggleSnapshotPin = (snapshot: OpsReportSnapshot) => {
    updateSnapshotMutation.mutate({
      snapshotId: snapshot.id,
      pinned: !snapshot.pinned,
      actor: "web"
    });
  };

  const requestDeleteSnapshot = async (snapshot: OpsReportSnapshot) => {
    const ok = await confirm({
      title: "리포트 스냅샷을 삭제할까요?",
      description: `"${snapshot.title}" 저장본이 삭제됩니다.`,
      confirmText: "삭제",
      cancelText: "취소",
      confirmVariant: "danger"
    });
    if (!ok) return;
    deleteSnapshotMutation.mutate({ snapshotId: snapshot.id });
  };

  return (
    <OpsPageShell>
      <Box className="border-default bg-surface rounded-[var(--radius-xl)] border px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-5)]">
        <Flex className="items-center justify-between gap-[var(--space-3)]">
          <Typography as="h2" variant="headingMd" className="tracking-[-0.01em]">
            운영 리포트
          </Typography>
          <Flex className="shrink-0 flex-wrap justify-end gap-[var(--space-2)]">
            <Badge variant="secondary" size="sm" shape="rounded" className="border border-default bg-surface-elevated font-semibold">
              환경: {environment}
            </Badge>
          </Flex>
        </Flex>
      </Box>

      {reportQuery.isError ? (
        <StateView variant="error" size="sm" title="운영 리포트 생성에 실패했습니다." className="border-default bg-surface rounded-[var(--radius-xl)] border p-[var(--space-4)]" />
      ) : report ? (
        <SplitWorkspaceLayout
          sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_360px]"
          main={
            <Box className="min-w-0 space-y-[var(--stack-gap)]">
              <OpsSectionCard title="리포트 요약" description="현재 필터 기준의 운영 위험도와 핵심 KPI입니다.">
                <Flex className="mb-[var(--space-3)] justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={reportQuery.isFetching ? true : undefined}
                    onClick={() => void reportQuery.refetch()}
                  >
                    갱신
                  </Button>
                </Flex>
                <ReportSummaryPanel report={report} />
              </OpsSectionCard>

              <OpsSectionCard title="액션 아이템" description="공유 후 바로 담당자와 우선순위를 정리할 항목입니다.">
                <Flex className="mb-[var(--space-3)] flex-wrap justify-end gap-[var(--space-2)]"><Button type="button" variant={openActionsOnly ? "primary" : "secondary"} size="sm" onClick={() => setOpenActionsOnly((value) => !value)}>{openActionsOnly ? "전체 보기" : "미완료만 보기"}</Button><Button type="button" variant="secondary" size="sm" onClick={exportActions} disabled={visibleActions.length === 0}>CSV 내보내기</Button></Flex>
                <ReportActionList actions={visibleActions} disabled={updateActionMutation.isPending} onToggle={(action, completed) => updateActionMutation.mutate({ actionId: action.id, completed, actor: "web" })} onUpdate={(action, values) => updateActionMutation.mutate({ actionId: action.id, completed: Boolean(action.completedAt), owner: values.owner, dueAt: values.dueAt, actor: "web" })} />
              </OpsSectionCard>

              <OpsSectionCard title="기술 상세" description="개발/운영 담당자가 원인 확인에 사용할 상세 요약입니다.">
                <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
                  <Typography as="p" variant="bodySm" color="muted" className="whitespace-pre-wrap font-mono leading-[1.7]">
                    {report.technicalSummary}
                  </Typography>
                </Box>
              </OpsSectionCard>
            </Box>
          }
          sidebar={
            <Box className="min-w-0 space-y-[var(--stack-gap)]">
              <OpsSectionCard title="우선 대응 이슈" description="발생 횟수와 심각도를 기준으로 정렬된 대응 후보입니다.">
                <ReportPriorityIssues issues={report.priorityIssues} />
              </OpsSectionCard>

              <OpsSectionCard title="공유용 리포트" description="Slack/Jira에 그대로 붙여넣을 수 있는 요약입니다.">
                <Flex className="mb-[var(--space-3)] justify-end">
                  <Button type="button" variant="secondary" size="sm" leftIcon={<Clipboard />} onClick={copyShareText}>
                    복사
                  </Button>
                </Flex>
                <Textarea
                  readOnly
                  value={report.shareText}
                  rows={13}
                  resize="none"
                  className="bg-surface-elevated font-mono text-caption leading-[1.6]"
                />
              </OpsSectionCard>

              <OpsSectionCard title="저장된 리포트" description="백엔드에 저장된 최근 리포트 스냅샷입니다.">
                <Box className="divide-y divide-default border-y border-default">
                  {(snapshotsQuery.data ?? []).slice(0, 5).map((snapshot) => (
                    <Box key={snapshot.id} className="py-[var(--space-2-5)]">
                      <Flex className="items-start justify-between gap-[var(--space-2)]">
                        <Box className="min-w-0">
                          <Flex className="min-w-0 items-center gap-[var(--space-1)]">
                            {snapshot.pinned ? (
                              <Badge variant="secondary" size="sm" shape="rounded" className="shrink-0">고정</Badge>
                            ) : null}
                            <Typography as="p" variant="caption" className="truncate font-semibold">
                              {snapshot.title}
                            </Typography>
                          </Flex>
                          <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)] line-clamp-2">
                            {snapshot.executiveSummary}
                          </Typography>
                          <Flex className="mt-[var(--space-2)] flex-wrap gap-[var(--space-1)]">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-[var(--space-2)] text-caption"
                              onClick={() => toggleSnapshotPin(snapshot)}
                            >
                              {snapshot.pinned ? "고정 해제" : "고정"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-[var(--space-2)] text-caption text-danger hover:text-danger"
                              onClick={() => void requestDeleteSnapshot(snapshot)}
                            >
                              삭제
                            </Button>
                          </Flex>
                        </Box>
                        <Badge
                          variant={snapshot.riskLevel === "critical" ? "danger" : snapshot.riskLevel === "warning" ? "warning" : "secondary"}
                          size="sm"
                          shape="rounded"
                          className="shrink-0 font-semibold"
                        >
                          {snapshot.riskLevel}
                        </Badge>
                      </Flex>
                    </Box>
                  ))}
                </Box>
                {!snapshotsQuery.isLoading && (snapshotsQuery.data ?? []).length === 0 ? (
                  <Typography as="p" variant="caption" color="muted" className="pt-[var(--space-3)]">
                    저장된 리포트가 없습니다.
                  </Typography>
                ) : null}
              </OpsSectionCard>
            </Box>
          }
        />
      ) : (
        <OpsSectionSkeleton
          rows={6}
          className="border-default bg-surface rounded-[var(--radius-xl)] border p-[var(--space-4)]"
        />
      )}
    </OpsPageShell>
  );
}
