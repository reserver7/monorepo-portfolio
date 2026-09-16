"use client";

import { FeedbackState } from "@/features/common/components/feedback-state";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAppForm } from "@repo/forms";
import { Box, Button, Flex, Grid, Input, Label, Progress, Select, Typography, toast } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import {
  addIssueComment,
  assignIssue,
  getIncidentTimeline,
  updateIncidentResponse,
  updateIncidentClosure,
  getIssueDetail,
  opslensQueryKeys,
  type IssueStatus,
  updateIssueStatus
} from "@repo/opslens";
import {
  OpsInfoItem,
  OpsIssueDetailSkeleton,
  OpsPageShell,
  OpsSectionCard,
  OpsSectionSkeleton
} from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { formatDateTime, formatNumber } from "@repo/utils";
import { ISSUE_DETAIL_STATUS_OPTIONS } from "../constants";
import { IncidentTimeline, IssueCommentsPanel, IssueLogList } from "../components";
import { readAuthSession } from "@/lib/auth";
import { resolveLocalizedError } from "@/lib/i18n/errors";

const formatElapsed = (from?: string | null, to?: string | null) => {
  if (!from) return "—";
  const milliseconds = Math.max(
    0,
    new Date(to ?? new Date().toISOString()).getTime() - new Date(from).getTime()
  );
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
};

export default function IssueDetailPage() {
  const t = useTranslations("issues.detail");
  const tError = useTranslations("error");
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const issueId = params.id;
  const queryClient = useQueryClient();
  const authSession = readAuthSession();
  const canOperate = authSession?.user.role === "admin" || authSession?.user.role === "operator";

  const assigneeForm = useAppForm<{ assignee: string }>({
    defaultValues: {
      assignee: ""
    }
  });
  const commentForm = useAppForm<{ author: string; body: string }>({
    defaultValues: {
      author: "운영담당자",
      body: ""
    }
  });
  const closureForm = useAppForm<{ rootCause: string; postmortemUrl: string }>({
    defaultValues: { rootCause: "", postmortemUrl: "" }
  });
  const responseForm = useAppForm<{
    commander: string;
    escalationLevel: string;
    statusUpdate: string;
    nextUpdateAt: string;
  }>({
    defaultValues: { commander: "", escalationLevel: "0", statusUpdate: "", nextUpdateAt: "" }
  });

  const assignee = assigneeForm.watch("assignee");

  const issueQuery = useQuery(
    useOpsQueryOptions("detail", {
      queryKey: opslensQueryKeys.issueDetail(issueId),
      queryFn: () => getIssueDetail(issueId),
      enabled: Boolean(issueId)
    })
  );

  const issue = issueQuery.data;
  useEffect(() => {
    if (!issue) return;
    closureForm.reset({ rootCause: issue.rootCause ?? "", postmortemUrl: issue.postmortemUrl ?? "" });
    responseForm.reset({
      commander: issue.commander ?? "",
      escalationLevel: String(issue.escalationLevel ?? 0),
      statusUpdate: issue.lastStatusUpdate ?? "",
      nextUpdateAt: issue.nextUpdateAt ? issue.nextUpdateAt.slice(0, 16) : ""
    });
  }, [closureForm, issue, responseForm]);
  const timelineQuery = useQuery(
    useOpsQueryOptions("detail", {
      queryKey: opslensQueryKeys.incidentTimeline(issueId),
      queryFn: () => getIncidentTimeline(issueId),
      enabled: Boolean(issueId)
    })
  );

  const statusMutation = useMutation({
    mutationFn: (status: IssueStatus) => updateIssueStatus(issueId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.issueDetail(issueId) }),
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.incidentTimeline(issueId) }),
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.all })
      ]);
      toast.success(t("statusUpdated"));
    },
    onError: (error) => {
      toast.error(resolveLocalizedError(error, tError as never, t("statusUpdateFailed")));
    }
  });

  const assigneeMutation = useMutation({
    mutationFn: (values: { assignee: string }) => assignIssue(issueId, values.assignee.trim()),
    onSuccess: async () => {
      assigneeForm.reset({ assignee: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.issueDetail(issueId) }),
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.incidentTimeline(issueId) }),
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.all })
      ]);
      toast.success(t("assigneeUpdated"));
    },
    onError: (error) => {
      toast.error(resolveLocalizedError(error, tError as never, t("assigneeUpdateFailed")));
    }
  });

  const commentMutation = useMutation({
    mutationFn: (values: { author: string; body: string }) =>
      addIssueComment(issueId, values.author.trim() || t("anonymous"), values.body.trim()),
    onSuccess: async () => {
      commentForm.setValue("body", "");
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.issueDetail(issueId) });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.incidentTimeline(issueId) });
      toast.success(t("commentAdded"));
    },
    onError: (error) => {
      toast.error(resolveLocalizedError(error, tError as never, t("commentAddFailed")));
    }
  });
  const closureMutation = useMutation({
    mutationFn: (values: { rootCause: string; postmortemUrl: string }) =>
      updateIncidentClosure({ issueId, rootCause: values.rootCause, postmortemUrl: values.postmortemUrl }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.issueDetail(issueId) }),
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.incidentTimeline(issueId) })
      ]);
      toast.success(t("closureSaved"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("closureSaveFailed")))
  });
  const responseMutation = useMutation({
    mutationFn: (values: {
      commander: string;
      escalationLevel: string;
      statusUpdate: string;
      nextUpdateAt: string;
    }) =>
      updateIncidentResponse({
        issueId,
        commander: values.commander,
        escalationLevel: Number(values.escalationLevel),
        statusUpdate: values.statusUpdate,
        nextUpdateAt: values.nextUpdateAt ? new Date(values.nextUpdateAt).toISOString() : undefined
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.issueDetail(issueId) }),
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.incidentTimeline(issueId) }),
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.all })
      ]);
      toast.success(t("responseSaved"));
    },
    onError: (error) => toast.error(resolveLocalizedError(error, tError as never, t("responseSaveFailed")))
  });

  const statusLabel = useMemo(() => {
    if (!issue) return "-";
    if (issue.status === "new") return t("statuses.new");
    if (issue.status === "analyzing") return t("statuses.analyzing");
    if (issue.status === "in_progress") return t("statuses.inProgress");
    return t("statuses.resolved");
  }, [issue, t]);
  const responseChecklist = issue
    ? [
        { label: t("checklist.assignee"), complete: Boolean(issue.assignee) },
        { label: t("checklist.commander"), complete: Boolean(issue.commander) },
        { label: t("checklist.responseStarted"), complete: issue.status !== "new" },
        { label: t("checklist.nextUpdate"), complete: Boolean(issue.nextUpdateAt) },
        { label: t("checklist.rootCause"), complete: Boolean(issue.rootCause) },
        { label: t("checklist.postmortem"), complete: Boolean(issue.postmortemUrl) }
      ]
    : [];
  const responseProgress =
    responseChecklist.length === 0
      ? 0
      : Math.round(
          (responseChecklist.filter((item) => item.complete).length / responseChecklist.length) * 100
        );
  const responseStartedAt = issue?.acknowledgedAt ?? issue?.firstOccurredAt;
  const copyIncidentSummary = async () => {
    if (!issue) return;
    const summary = `[${issue.severity.toUpperCase()}] ${issue.title}\n${t("summary.status")}: ${statusLabel} · ${t("summary.assignee")}: ${issue.assignee || t("unassigned")}\n${t("summary.service")}: ${issue.serviceName} (${issue.environment})\n${t("summary.lastOccurred")}: ${formatDateTime(issue.lastOccurredAt, locale)}\n${t("summary.response")}: ${issue.suggestedActions[0] || t("needsReview")}`;
    try {
      await navigator.clipboard.writeText(summary);
      toast.success(t("summaryCopied"));
    } catch {
      toast.error(t("summaryCopyFailed"));
    }
  };

  if (issueQuery.isLoading) {
    return <OpsIssueDetailSkeleton />;
  }

  if (issueQuery.isError || !issue) {
    return (
      <FeedbackState
        variant="error"
        size="lg"
        title={t("loadFailed")}
        description={t("loadFailedDescription")}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void issueQuery.refetch()}
            loading={issueQuery.isFetching}
          >
            {t("retry")}
          </Button>
        }
      />
    );
  }

  return (
    <OpsPageShell>
      <OpsSectionCard title={t("warRoomTitle")} description={t("warRoomDescription")}>
        <Flex className="flex-wrap items-start justify-between gap-[var(--space-3)]">
          <Box>
            <Typography as="h2" variant="h2" className="text-heading-xl">
              {issue.title}
            </Typography>
            <Typography as="p" variant="bodySm" color="muted" className="mt-[var(--space-2)]">
              {issue.summary}
            </Typography>
          </Box>
          <Link href="/issues" className="text-primary text-sm font-semibold hover:underline">
            {t("backToList")}
          </Link>
          <Button type="button" variant="secondary" size="md" onClick={() => void copyIncidentSummary()}>
            {t("copySummary")}
          </Button>
          <Link
            href={`/logs?service=${encodeURIComponent(issue.serviceName)}${issue.deploymentVersion ? `&deployment=${encodeURIComponent(issue.deploymentVersion)}` : ""}`}
            className="text-primary text-sm font-semibold hover:underline"
          >
            {t("exploreLogs")}
          </Link>
        </Flex>

        <Grid className="mt-[var(--space-4)] gap-[var(--space-3)] md:grid-cols-4">
          <OpsInfoItem label={t("fields.severity")} value={issue.severity} />
          <OpsInfoItem label={t("fields.status")} value={statusLabel} />
          <OpsInfoItem
            label={t("fields.occurrences")}
            value={`${formatNumber(issue.occurrenceCount, locale)}${t("occurrenceUnit")}`}
          />
          <OpsInfoItem label={t("fields.assignee")} value={issue.assignee || t("unassigned")} />
          <OpsInfoItem label={t("fields.commander")} value={issue.commander || t("unassigned")} />
          <OpsInfoItem label={t("fields.escalation")} value={`L${issue.escalationLevel}`} />
          <OpsInfoItem label={t("fields.service")} value={issue.serviceName} />
          <OpsInfoItem label={t("fields.environment")} value={issue.environment} />
          <OpsInfoItem
            label={t("fields.firstOccurred")}
            value={formatDateTime(issue.firstOccurredAt, locale)}
          />
          <OpsInfoItem
            label={t("fields.lastOccurred")}
            value={formatDateTime(issue.lastOccurredAt, locale)}
          />
          <OpsInfoItem
            label={t("fields.acknowledged")}
            value={issue.acknowledgedAt ? formatDateTime(issue.acknowledgedAt, locale) : t("notConfirmed")}
          />
          <OpsInfoItem
            label={t("fields.resolvedAt")}
            value={issue.resolvedAt ? formatDateTime(issue.resolvedAt, locale) : t("unresolved")}
          />
          <OpsInfoItem
            label={t("fields.timeToAcknowledge")}
            value={
              issue.acknowledgedAt
                ? formatElapsed(issue.firstOccurredAt, issue.acknowledgedAt)
                : t("notConfirmed")
            }
          />
          <OpsInfoItem
            label={t("fields.responseElapsed")}
            value={formatElapsed(responseStartedAt, issue.resolvedAt)}
          />
          <OpsInfoItem
            label={t("fields.nextUpdate")}
            value={issue.nextUpdateAt ? formatDateTime(issue.nextUpdateAt, locale) : t("notConfigured")}
          />
          <OpsInfoItem label={t("fields.responseProgress")} value={`${responseProgress}%`} />
        </Grid>
        <Box className="border-primary/20 bg-primary/5 mt-[var(--space-4)] rounded-[var(--radius-lg)] border p-[var(--space-4)]">
          <Flex className="items-center justify-between gap-[var(--space-3)]">
            <Typography as="p" variant="bodySm" className="font-semibold">
              {t("checklist.title")}
            </Typography>
            <Typography as="p" variant="caption" color="muted">
              {t("checklist.progress", {
                complete: responseChecklist.filter((item) => item.complete).length,
                total: responseChecklist.length
              })}
            </Typography>
          </Flex>
          <Progress
            value={responseProgress}
            className="mt-[var(--space-2)]"
            aria-label={t("checklist.progressAria")}
          />
          <Flex className="mt-[var(--space-3)] flex-wrap gap-[var(--space-2)]">
            {responseChecklist.map((item) => (
              <Typography
                key={item.label}
                as="span"
                variant="caption"
                className={item.complete ? "text-success" : "text-muted"}
              >
                {item.complete ? "✓" : "○"} {item.label}
              </Typography>
            ))}
          </Flex>
        </Box>
      </OpsSectionCard>

      <Grid className="gap-[var(--space-5)] xl:grid-cols-2">
        <OpsSectionCard title={t("steps.quickStart.title")} description={t("steps.quickStart.description")}>
          <Flex className="flex-wrap gap-[var(--space-2)]">
            {[
              {
                label: t("templates.initialResponse"),
                body: "[초기 대응]\n- 영향 범위 확인\n- 담당자 지정\n- 고객 영향 여부 확인"
              },
              {
                label: t("templates.roleAssignment"),
                body: "[워룸 역할]\n- 지휘자: 의사결정·에스컬레이션\n- 조사 담당: 로그·배포 원인 분석\n- 공지 담당: 내부/고객 상태 공지"
              },
              {
                label: t("templates.deploymentCheck"),
                body: "[배포 영향 확인]\n- 최근 배포 버전 대조\n- 오류 증가량 확인\n- 롤백 기준 검토"
              },
              {
                label: t("templates.closureCheck"),
                body: "[종료 점검]\n- Root cause 기록\n- 재발 방지 액션 등록\n- Postmortem 링크 첨부"
              }
            ].map((template) => (
              <Button
                key={template.label}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  commentForm.setValue("body", template.body);
                  toast.info(t("templateApplied", { label: template.label }));
                }}
              >
                {template.label}
              </Button>
            ))}
          </Flex>
        </OpsSectionCard>
        <OpsSectionCard
          title={t("steps.assignment.title")}
          description={canOperate ? t("steps.assignment.operatorDescription") : t("readOnly")}
        >
          <Grid className="mt-[var(--space-3)] gap-[var(--space-3)] md:grid-cols-2">
            <Grid className="gap-[var(--space-1)]">
              <Label htmlFor="issue-status">{t("fields.changeStatus")}</Label>
              <Select
                options={ISSUE_DETAIL_STATUS_OPTIONS}
                value={issue.status}
                onChange={(value) => statusMutation.mutate(String(value) as IssueStatus)}
                disabled={!canOperate || statusMutation.isPending}
                size="md"
              />
            </Grid>

            <Grid className="gap-[var(--space-1)] text-sm">
              <Label htmlFor="issue-assignee">{t("fields.assignAssignee")}</Label>
              <form
                className="flex gap-[var(--space-2)]"
                onSubmit={assigneeForm.handleSubmit((values) => assigneeMutation.mutate(values))}
              >
                <Input
                  id="issue-assignee"
                  placeholder={t("assigneePlaceholder")}
                  className="flex-1"
                  size="md"
                  control={assigneeForm.control}
                  name="assignee"
                />
                <Button
                  type="submit"
                  disabled={!canOperate || assigneeMutation.isPending || assignee.trim().length === 0}
                  variant="primary"
                  loading={assigneeMutation.isPending ? true : undefined}
                >
                  {t("save")}
                </Button>
                {authSession?.user.name && issue.assignee !== authSession.user.name ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!canOperate || assigneeMutation.isPending}
                    onClick={() => assigneeMutation.mutate({ assignee: authSession.user.name })}
                  >
                    {t("assignToMe")}
                  </Button>
                ) : null}
              </form>
            </Grid>
          </Grid>
        </OpsSectionCard>

        <OpsSectionCard title={t("steps.command.title")} description={t("steps.command.description")}>
          <form
            className="mt-[var(--space-3)] grid gap-[var(--space-3)]"
            onSubmit={responseForm.handleSubmit((values) => responseMutation.mutate(values))}
          >
            <Grid className="gap-[var(--space-3)] md:grid-cols-2">
              <Input
                label={t("fields.incidentCommander")}
                placeholder={t("commanderPlaceholder")}
                control={responseForm.control}
                name="commander"
                disabled={!canOperate}
              />
              <Select
                label={t("fields.escalationLevel")}
                value={responseForm.watch("escalationLevel")}
                onChange={(value) => responseForm.setValue("escalationLevel", String(value))}
                disabled={!canOperate}
                options={[0, 1, 2, 3, 4, 5].map((value) => ({ label: `L${value}`, value: String(value) }))}
              />
            </Grid>
            <Input
              label={t("fields.nextStatusUpdate")}
              type="datetime-local"
              control={responseForm.control}
              name="nextUpdateAt"
              disabled={!canOperate}
            />
            <Input
              label={t("fields.currentStatusUpdate")}
              placeholder={t("statusUpdatePlaceholder")}
              control={responseForm.control}
              name="statusUpdate"
              disabled={!canOperate}
            />
            {issue.lastStatusUpdate ? (
              <Flex className="flex-wrap items-center gap-[var(--space-2)]">
                <Typography as="p" variant="caption" color="muted">
                  {t("recentUpdate", { update: issue.lastStatusUpdate })}
                  {issue.nextUpdateAt
                    ? ` · ${t("nextUpdate", { value: formatDateTime(issue.nextUpdateAt, locale) })}`
                    : ""}
                </Typography>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(`[${issue.serviceName}] ${issue.lastStatusUpdate}`)
                      .then(() => toast.success(t("statusUpdateCopied")))
                      .catch(() => toast.error(t("statusUpdateCopyFailed")))
                  }
                >
                  {t("copyUpdate")}
                </Button>
              </Flex>
            ) : null}
            {canOperate ? (
              <Button type="submit" size="sm" className="w-fit" loading={responseMutation.isPending}>
                {t("saveResponse")}
              </Button>
            ) : null}
          </form>
        </OpsSectionCard>

        <OpsSectionCard
          title={t("steps.investigation.title")}
          description={t("steps.investigation.description")}
        >
          <Box className="mt-[var(--space-3)] space-y-[var(--space-3)] text-sm">
            <Box>
              <Box as="p" className="text-foreground mb-[var(--space-1)] font-semibold">
                {t("investigation.causes")}
              </Box>
              <ul className="text-muted list-disc space-y-[var(--space-1)] pl-[var(--space-5)]">
                {issue.probableCauses.map((cause) => (
                  <li key={cause}>{cause}</li>
                ))}
              </ul>
            </Box>
            <Box>
              <Box as="p" className="text-foreground mb-[var(--space-1)] font-semibold">
                {t("investigation.actions")}
              </Box>
              <ul className="text-muted list-disc space-y-[var(--space-1)] pl-[var(--space-5)]">
                {issue.suggestedActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </Box>
            <Box>
              <Box as="p" className="text-foreground mb-[var(--space-1)] font-semibold">
                {t("investigation.reproduction")}
              </Box>
              <Box as="p" className="text-muted">
                {issue.reproductionGuide}
              </Box>
            </Box>
          </Box>
        </OpsSectionCard>
      </Grid>

      <OpsSectionCard
        title={t("closure.title")}
        description={
          issue.status === "resolved" ? t("closure.resolvedDescription") : t("closure.openDescription")
        }
      >
        <Grid className="mt-[var(--space-3)] gap-[var(--space-2)] md:grid-cols-2">
          {[
            [t("checklist.assignee"), Boolean(issue.assignee)],
            [t("fields.acknowledged"), Boolean(issue.acknowledgedAt)],
            ["Root cause", Boolean(issue.rootCause)],
            ["Postmortem", Boolean(issue.postmortemUrl)]
          ].map(([label, complete]) => (
            <Box
              key={String(label)}
              className="border-default flex items-center justify-between rounded-[var(--radius-md)] border p-[var(--space-2)]"
            >
              <Typography as="p" variant="caption">
                {label}
              </Typography>
              <Typography as="p" variant="caption" className={complete ? "text-success" : "text-warning"}>
                {complete ? t("complete") : t("required")}
              </Typography>
            </Box>
          ))}
        </Grid>
        {issue.status === "resolved" && (!issue.rootCause || !issue.postmortemUrl) ? (
          <Typography as="p" variant="bodySm" className="text-warning mt-[var(--space-3)]">
            {t("closure.missing", { field: !issue.rootCause ? "root cause" : "postmortem link" })}
          </Typography>
        ) : null}
        {canOperate ? (
          <Box className="mt-[var(--space-3)] grid gap-[var(--space-3)]">
            <Input
              label="Root cause"
              placeholder={t("rootCausePlaceholder")}
              control={closureForm.control}
              name="rootCause"
            />
            <Input
              label="Postmortem URL"
              type="url"
              placeholder="https://..."
              control={closureForm.control}
              name="postmortemUrl"
            />
            <Button
              type="button"
              size="sm"
              className="w-fit"
              loading={closureMutation.isPending}
              onClick={() => {
                const values = closureForm.getValues();
                if (values.postmortemUrl.trim() && !/^https?:\/\//i.test(values.postmortemUrl.trim())) {
                  toast.error(t("postmortemUrlInvalid"));
                  return;
                }
                closureMutation.mutate(values);
              }}
            >
              {t("saveClosure")}
            </Button>
            {issue.postmortemUrl ? (
              <Link
                href={issue.postmortemUrl}
                target="_blank"
                className="text-primary text-sm font-semibold hover:underline"
              >
                {t("openPostmortem")}
              </Link>
            ) : null}
          </Box>
        ) : (
          <Typography as="p" variant="bodySm" color="muted">
            {t("readOnlyClosure")}
          </Typography>
        )}
      </OpsSectionCard>

      <Grid className="gap-[var(--space-6)] xl:grid-cols-2">
        <OpsSectionCard title={t("timelineTitle")} description={t("timelineDescription")}>
          {timelineQuery.isLoading ? (
            <OpsSectionSkeleton rows={4} />
          ) : (
            <IncidentTimeline items={timelineQuery.data ?? []} />
          )}
        </OpsSectionCard>

        <OpsSectionCard title={t("relatedLogs")}>
          <IssueLogList logs={issue.logs} />
        </OpsSectionCard>

        <OpsSectionCard title={t("commentsTitle")}>
          {canOperate ? (
            <IssueCommentsPanel
              comments={issue.comments}
              form={commentForm}
              isSubmitting={commentMutation.isPending}
              onSubmit={(values) => commentMutation.mutate(values)}
            />
          ) : (
            <Box className="mt-[var(--space-3)]">
              <Typography as="p" variant="bodySm" color="muted">
                {t("readOnlyComments")}
              </Typography>
              <IncidentTimeline items={timelineQuery.data?.filter((item) => item.kind === "comment") ?? []} />
            </Box>
          )}
        </OpsSectionCard>
      </Grid>
      {canOperate && issue.status !== "resolved" ? (
        <>
          <Box className="h-[calc(var(--size-control-md)+var(--space-6))] md:hidden" />
          <Box className="border-default bg-surface/95 fixed inset-x-0 bottom-0 z-30 border-t p-[var(--space-2)] pb-[max(var(--space-2),env(safe-area-inset-bottom))] shadow-lg backdrop-blur md:hidden">
            <Flex className="mx-auto max-w-[var(--content-max-width)] gap-[var(--space-2)]">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate(issue.status === "new" ? "analyzing" : "in_progress")}
              >
                {issue.status === "new" ? t("startResponse") : t("continueResponse")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => void copyIncidentSummary()}
              >
                {t("copySummaryShort")}
              </Button>
            </Flex>
          </Box>
        </>
      ) : null}
    </OpsPageShell>
  );
}
