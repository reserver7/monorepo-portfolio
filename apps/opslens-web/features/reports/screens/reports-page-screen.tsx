"use client";

import { FeedbackState } from "@/features/common/components/feedback-state";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Clipboard, Printer } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { Badge, Box, Button, Flex, SplitWorkspaceLayout, Textarea, Typography, confirm, toast } from "@repo/ui";
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
  const t = useTranslations("reports");
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
      await queryClient.invalidateQueries({
        queryKey: opslensQueryKeys.reportActions(report?.snapshotId ?? "")
      });
      toast.success(variables.completed ? t("actionCompleted") : t("actionReopened"));
    }
  });
  const deleteSnapshotMutation = useMutation({
    mutationFn: ({ snapshotId }: { snapshotId: string }) => deleteReportSnapshot(snapshotId, "web"),
    onSuccess: invalidateSnapshots
  });
  const visibleActions = useMemo(
    () => (actionsQuery.data ?? []).filter((action) => !openActionsOnly || !action.completedAt),
    [actionsQuery.data, openActionsOnly]
  );
  const exportActions = () =>
    downloadCsv(
      `opslens-report-actions-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        t("csv.priority"),
        t("csv.action"),
        t("csv.owner"),
        t("csv.status"),
        t("csv.completedBy"),
        t("csv.completedAt")
      ],
      visibleActions.map((action) => [
        action.priority,
        action.title,
        action.owner,
        action.completedAt ? t("csv.completed") : t("csv.needsAction"),
        action.completedBy,
        action.completedAt
      ])
    );

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
      toast.success(t("copySuccess"));
    } catch {
      toast.error(t("copyFailed"));
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
      title: t("deleteConfirmTitle"),
      description: t("deleteConfirmDescription", { title: snapshot.title }),
      confirmText: t("delete"),
      cancelText: t("cancel"),
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
            {t("title")}
          </Typography>
          <Flex className="shrink-0 flex-wrap justify-end gap-[var(--space-2)]">
            <Badge
              variant="secondary"
              size="sm"
              shape="rounded"
              className="border-default bg-surface-elevated border font-semibold"
            >
              {t("environment")}: {environment}
            </Badge>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={() => window.print()}
            >
              {t("printPdf")}
            </Button>
          </Flex>
        </Flex>
      </Box>

      {reportQuery.isError ? (
        <FeedbackState variant="error" size="sm" title="운영 리포트 생성에 실패했습니다." className="border-default bg-surface rounded-[var(--radius-xl)] border p-[var(--space-4)]" />
      ) : report ? (
        <SplitWorkspaceLayout
          sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_360px]"
          main={
            <Box className="min-w-0 space-y-[var(--stack-gap)]">
              <OpsSectionCard title={t("summary.title")} description={t("summary.description")}>
                <Flex className="mb-[var(--space-3)] justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={reportQuery.isFetching ? true : undefined}
                    onClick={() => void reportQuery.refetch()}
                  >
                    {t("refresh")}
                  </Button>
                </Flex>
                <ReportSummaryPanel report={report} />
              </OpsSectionCard>

              <OpsSectionCard title={t("actions.title")} description={t("actions.description")}>
                <Flex className="mb-[var(--space-3)] flex-wrap justify-end gap-[var(--space-2)]">
                  <Button
                    type="button"
                    variant={openActionsOnly ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setOpenActionsOnly((value) => !value)}
                  >
                    {openActionsOnly ? t("actions.showAll") : t("actions.showOpen")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={exportActions}
                    disabled={visibleActions.length === 0}
                  >
                    {t("exportCsv")}
                  </Button>
                </Flex>
                <ReportActionList
                  actions={visibleActions}
                  disabled={updateActionMutation.isPending}
                  onToggle={(action, completed) =>
                    updateActionMutation.mutate({ actionId: action.id, completed, actor: "web" })
                  }
                  onUpdate={(action, values) =>
                    updateActionMutation.mutate({
                      actionId: action.id,
                      completed: Boolean(action.completedAt),
                      owner: values.owner,
                      dueAt: values.dueAt,
                      actor: "web"
                    })
                  }
                />
              </OpsSectionCard>

              <OpsSectionCard title={t("technical.title")} description={t("technical.description")}>
                <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
                  <Typography
                    as="p"
                    variant="bodySm"
                    color="muted"
                    className="whitespace-pre-wrap font-mono leading-[1.7]"
                  >
                    {report.technicalSummary}
                  </Typography>
                </Box>
              </OpsSectionCard>
            </Box>
          }
          sidebar={
            <Box className="min-w-0 space-y-[var(--stack-gap)]">
              <OpsSectionCard title={t("priority.title")} description={t("priority.description")}>
                <ReportPriorityIssues issues={report.priorityIssues} />
              </OpsSectionCard>

              <OpsSectionCard title={t("share.title")} description={t("share.description")}>
                <Flex className="mb-[var(--space-3)] justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<Clipboard />}
                    onClick={copyShareText}
                  >
                    {t("copy")}
                  </Button>
                </Flex>
                <Textarea
                  readOnly
                  value={report.shareText}
                  rows={13}
                  resize="none"
                  className="bg-surface-elevated text-caption font-mono leading-[1.6]"
                />
              </OpsSectionCard>

              <OpsSectionCard title={t("saved.title")} description={t("saved.description")}>
                <Box className="divide-default border-default divide-y border-y">
                  {(snapshotsQuery.data ?? []).slice(0, 5).map((snapshot) => (
                    <Box key={snapshot.id} className="py-[var(--space-2-5)]">
                      <Flex className="items-start justify-between gap-[var(--space-2)]">
                        <Box className="min-w-0">
                          <Flex className="min-w-0 items-center gap-[var(--space-1)]">
                            {snapshot.pinned ? (
                              <Badge variant="secondary" size="sm" shape="rounded" className="shrink-0">
                                {t("pin")}
                              </Badge>
                            ) : null}
                            <Typography as="p" variant="caption" className="truncate font-semibold">
                              {snapshot.title}
                            </Typography>
                          </Flex>
                          <Typography
                            as="p"
                            variant="caption"
                            color="muted"
                            className="mt-[var(--space-1)] line-clamp-2"
                          >
                            {snapshot.executiveSummary}
                          </Typography>
                          <Flex className="mt-[var(--space-2)] flex-wrap gap-[var(--space-1)]">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-caption h-7 px-[var(--space-2)]"
                              onClick={() => toggleSnapshotPin(snapshot)}
                            >
                              {snapshot.pinned ? t("unpin") : t("pin")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-caption text-danger hover:text-danger h-7 px-[var(--space-2)]"
                              onClick={() => void requestDeleteSnapshot(snapshot)}
                            >
                              {t("delete")}
                            </Button>
                          </Flex>
                        </Box>
                        <Badge
                          variant={
                            snapshot.riskLevel === "critical"
                              ? "danger"
                              : snapshot.riskLevel === "warning"
                                ? "warning"
                                : "secondary"
                          }
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
                    {t("saved.empty")}
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
