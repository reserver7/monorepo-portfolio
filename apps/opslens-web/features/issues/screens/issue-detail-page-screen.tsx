"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { Box, Button, Flex, Grid, Input, Label, Progress, Select, StateView, Typography, toast } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import {
  addIssueComment,
  assignIssue,
  getIncidentTimeline,
  updateIncidentClosure,
  getIssueDetail,
  opslensQueryKeys,
  type IssueStatus,
  updateIssueStatus
} from "@repo/opslens";
import { OpsInfoItem, OpsIssueDetailSkeleton, OpsPageShell, OpsSectionCard, OpsSectionSkeleton } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { formatDateTime, formatNumber } from "@repo/utils";
import { ISSUE_DETAIL_STATUS_OPTIONS } from "../constants";
import { IncidentTimeline, IssueCommentsPanel, IssueLogList } from "../components";
import { readAuthSession } from "@/lib/auth";

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const issueId = params.id;
  const queryClient = useQueryClient();
  const canOperate = readAuthSession()?.user.role === "admin" || readAuthSession()?.user.role === "operator";

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
  const closureForm = useAppForm<{ rootCause: string; postmortemUrl: string }>({ defaultValues: { rootCause: "", postmortemUrl: "" } });

  const assignee = assigneeForm.watch("assignee");

  const issueQuery = useQuery(useOpsQueryOptions("detail", {
    queryKey: opslensQueryKeys.issueDetail(issueId),
    queryFn: () => getIssueDetail(issueId),
    enabled: Boolean(issueId)
  }));

  const issue = issueQuery.data;
  useEffect(() => {
    if (!issue) return;
    closureForm.reset({ rootCause: issue.rootCause ?? "", postmortemUrl: issue.postmortemUrl ?? "" });
  }, [closureForm, issue]);
  const timelineQuery = useQuery(useOpsQueryOptions("detail", {
    queryKey: opslensQueryKeys.incidentTimeline(issueId),
    queryFn: () => getIncidentTimeline(issueId),
    enabled: Boolean(issueId)
  }));

  const statusMutation = useMutation({
    mutationFn: (status: IssueStatus) => updateIssueStatus(issueId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.issueDetail(issueId) }),
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.incidentTimeline(issueId) }),
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.all })
      ]);
      toast.success("이슈 상태를 변경했습니다.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "이슈 상태 변경에 실패했습니다.");
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
      toast.success("담당자를 지정했습니다.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "담당자 지정에 실패했습니다.");
    }
  });

  const commentMutation = useMutation({
    mutationFn: (values: { author: string; body: string }) =>
      addIssueComment(issueId, values.author.trim() || "익명", values.body.trim()),
    onSuccess: async () => {
      commentForm.setValue("body", "");
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.issueDetail(issueId) });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.incidentTimeline(issueId) });
      toast.success("댓글을 등록했습니다.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "댓글 등록에 실패했습니다.");
    }
  });
  const closureMutation = useMutation({
    mutationFn: (values: { rootCause: string; postmortemUrl: string }) => updateIncidentClosure({ issueId, rootCause: values.rootCause, postmortemUrl: values.postmortemUrl }),
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: opslensQueryKeys.issueDetail(issueId) }), queryClient.invalidateQueries({ queryKey: opslensQueryKeys.incidentTimeline(issueId) })]);
      toast.success("종료 정보를 저장했습니다.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "종료 정보 저장에 실패했습니다.")
  });

  const statusLabel = useMemo(() => {
    if (!issue) return "-";
    if (issue.status === "new") return "신규";
    if (issue.status === "analyzing") return "분석중";
    if (issue.status === "in_progress") return "대응중";
    return "해결";
  }, [issue]);
  const responseChecklist = issue ? [
    { label: "담당자 지정", complete: Boolean(issue.assignee) },
    { label: "대응 시작", complete: issue.status !== "new" },
    { label: "원인 기록", complete: Boolean(issue.rootCause) },
    { label: "사후 분석", complete: Boolean(issue.postmortemUrl) }
  ] : [];
  const responseProgress = responseChecklist.length === 0 ? 0 : Math.round((responseChecklist.filter((item) => item.complete).length / responseChecklist.length) * 100);
  const copyIncidentSummary = async () => {
    if (!issue) return;
    const summary = `[${issue.severity.toUpperCase()}] ${issue.title}\n상태: ${statusLabel} · 담당: ${issue.assignee || "미지정"}\n서비스: ${issue.serviceName} (${issue.environment})\n최근 발생: ${formatDateTime(issue.lastOccurredAt)}\n대응: ${issue.suggestedActions[0] || "확인 필요"}`;
    try { await navigator.clipboard.writeText(summary); toast.success("인시던트 공유 요약을 복사했습니다."); } catch { toast.error("공유 요약 복사에 실패했습니다."); }
  };

  if (issueQuery.isLoading) {
    return <OpsIssueDetailSkeleton />;
  }

  if (issueQuery.isError || !issue) {
    return (
      <StateView
        variant="error"
        size="lg"
        title="이슈 상세 조회에 실패했습니다."
        description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
        action={
          <Button variant="outline" size="sm" onClick={() => void issueQuery.refetch()} loading={issueQuery.isFetching}>
            다시 시도
          </Button>
        }
      />
    );
  }

  return (
    <OpsPageShell>
      <OpsSectionCard title="Issue Detail">
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
            목록으로 이동
          </Link>
          <Button type="button" variant="secondary" size="sm" onClick={() => void copyIncidentSummary()}>공유 요약 복사</Button>
          <Link href={`/logs?service=${encodeURIComponent(issue.serviceName)}${issue.deploymentVersion ? `&deployment=${encodeURIComponent(issue.deploymentVersion)}` : ""}`} className="text-primary text-sm font-semibold hover:underline">
            관련 로그 탐색
          </Link>
        </Flex>

        <Grid className="mt-[var(--space-4)] gap-[var(--space-3)] md:grid-cols-4">
          <OpsInfoItem label="심각도" value={issue.severity} />
          <OpsInfoItem label="상태" value={statusLabel} />
          <OpsInfoItem label="발생 횟수" value={`${formatNumber(issue.occurrenceCount)}회`} />
          <OpsInfoItem label="담당자" value={issue.assignee || "미지정"} />
          <OpsInfoItem label="서비스" value={issue.serviceName} />
          <OpsInfoItem label="환경" value={issue.environment} />
          <OpsInfoItem label="최초 발생" value={formatDateTime(issue.firstOccurredAt)} />
          <OpsInfoItem label="최근 발생" value={formatDateTime(issue.lastOccurredAt)} />
          <OpsInfoItem label="최초 확인" value={issue.acknowledgedAt ? formatDateTime(issue.acknowledgedAt) : "미확인"} />
          <OpsInfoItem label="해결 시각" value={issue.resolvedAt ? formatDateTime(issue.resolvedAt) : "미해결"} />
        </Grid>
        <Box className="border-default bg-surface-elevated mt-[var(--space-4)] rounded-[var(--radius-md)] border p-[var(--space-3)]">
          <Flex className="items-center justify-between gap-[var(--space-3)]"><Typography as="p" variant="bodySm" className="font-semibold">대응 체크리스트</Typography><Typography as="p" variant="caption" color="muted">{responseChecklist.filter((item) => item.complete).length}/{responseChecklist.length} 완료</Typography></Flex>
          <Progress value={responseProgress} className="mt-[var(--space-2)]" aria-label="인시던트 대응 진행률" />
          <Flex className="mt-[var(--space-3)] flex-wrap gap-[var(--space-2)]">{responseChecklist.map((item) => <Typography key={item.label} as="span" variant="caption" className={item.complete ? "text-success" : "text-muted"}>{item.complete ? "✓" : "○"} {item.label}</Typography>)}</Flex>
        </Box>
      </OpsSectionCard>

      <Grid className="gap-[var(--space-6)] xl:grid-cols-2">
        <OpsSectionCard title="대응 템플릿" description="반복되는 운영 절차를 메모에 빠르게 적용합니다.">
          <Flex className="flex-wrap gap-[var(--space-2)]">
            {[{ label: "초기 대응", body: "[초기 대응]\n- 영향 범위 확인\n- 담당자 지정\n- 고객 영향 여부 확인" }, { label: "배포 확인", body: "[배포 영향 확인]\n- 최근 배포 버전 대조\n- 오류 증가량 확인\n- 롤백 기준 검토" }, { label: "종료 점검", body: "[종료 점검]\n- Root cause 기록\n- 재발 방지 액션 등록\n- Postmortem 링크 첨부" }].map((template) => <Button key={template.label} type="button" variant="secondary" size="sm" onClick={() => { commentForm.setValue("body", template.body); toast.info(`${template.label} 템플릿을 메모에 적용했습니다.`); }}>{template.label}</Button>)}
          </Flex>
        </OpsSectionCard>
        <OpsSectionCard title="상태/담당자 관리" description={canOperate ? undefined : "조회 전용 역할에서는 변경할 수 없습니다."}>
          <Grid className="mt-[var(--space-3)] gap-[var(--space-3)] md:grid-cols-2">
            <Grid className="gap-[var(--space-1)]">
              <Label htmlFor="issue-status">상태 변경</Label>
              <Select
                options={ISSUE_DETAIL_STATUS_OPTIONS}
                value={issue.status}
                onChange={(value) => statusMutation.mutate(String(value) as IssueStatus)}
                disabled={!canOperate || statusMutation.isPending}
                size="md"
              />
            </Grid>

            <Grid className="gap-[var(--space-1)] text-sm">
              <Label htmlFor="issue-assignee">담당자 지정</Label>
              <form
                className="flex gap-[var(--space-2)]"
                onSubmit={assigneeForm.handleSubmit((values) => assigneeMutation.mutate(values))}
              >
                <Input
                  id="issue-assignee"
                  placeholder="예: reserver7"
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
                  저장
                </Button>
              </form>
            </Grid>
          </Grid>
        </OpsSectionCard>

        <OpsSectionCard title="AI 원인 후보 / 대응 액션">
          <Box className="mt-[var(--space-3)] space-y-[var(--space-3)] text-sm">
            <Box>
              <Box as="p" className="text-foreground mb-[var(--space-1)] font-semibold">원인 후보</Box>
              <ul className="text-muted list-disc space-y-[var(--space-1)] pl-[var(--space-5)]">
                {issue.probableCauses.map((cause) => (
                  <li key={cause}>{cause}</li>
                ))}
              </ul>
            </Box>
            <Box>
              <Box as="p" className="text-foreground mb-[var(--space-1)] font-semibold">권장 액션</Box>
              <ul className="text-muted list-disc space-y-[var(--space-1)] pl-[var(--space-5)]">
                {issue.suggestedActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </Box>
            <Box>
              <Box as="p" className="text-foreground mb-[var(--space-1)] font-semibold">재현 가이드</Box>
              <Box as="p" className="text-muted">{issue.reproductionGuide}</Box>
            </Box>
          </Box>
        </OpsSectionCard>
      </Grid>

      <OpsSectionCard title="종료 정보" description={issue.status === "resolved" ? "해결 근거와 사후 분석 문서를 기록하세요." : "해결 후 사후 분석을 위해 원인과 문서 링크를 미리 기록할 수 있습니다."}>
        <Grid className="mt-[var(--space-3)] gap-[var(--space-2)] md:grid-cols-2">
          {[
            ["담당자 지정", Boolean(issue.assignee)],
            ["최초 확인", Boolean(issue.acknowledgedAt)],
            ["Root cause", Boolean(issue.rootCause)],
            ["Postmortem", Boolean(issue.postmortemUrl)]
          ].map(([label, complete]) => <Box key={String(label)} className="border-default flex items-center justify-between rounded-[var(--radius-md)] border p-[var(--space-2)]"><Typography as="p" variant="caption">{label}</Typography><Typography as="p" variant="caption" className={complete ? "text-success" : "text-warning"}>{complete ? "완료" : "필요"}</Typography></Box>)}
        </Grid>
        {issue.status === "resolved" && (!issue.rootCause || !issue.postmortemUrl) ? <Typography as="p" variant="bodySm" className="mt-[var(--space-3)] text-warning">해결된 이슈입니다. 재발 방지를 위해 {!issue.rootCause ? "root cause" : "postmortem 링크"}를 기록하세요.</Typography> : null}
        {canOperate ? (
          <Box className="mt-[var(--space-3)] grid gap-[var(--space-3)]">
            <Input label="Root cause" placeholder="예: 결제 API의 timeout 재시도 정책 누락" control={closureForm.control} name="rootCause" />
            <Input label="Postmortem URL" type="url" placeholder="https://..." control={closureForm.control} name="postmortemUrl" />
            <Button type="button" size="sm" className="w-fit" loading={closureMutation.isPending} onClick={() => {
              const values = closureForm.getValues();
              if (values.postmortemUrl.trim() && !/^https?:\/\//i.test(values.postmortemUrl.trim())) {
                toast.error("Postmortem URL은 http:// 또는 https://로 시작해야 합니다.");
                return;
              }
              closureMutation.mutate(values);
            }}>종료 정보 저장</Button>
            {issue.postmortemUrl ? <Link href={issue.postmortemUrl} target="_blank" className="text-primary text-sm font-semibold hover:underline">Postmortem 열기</Link> : null}
          </Box>
        ) : <Typography as="p" variant="bodySm" color="muted">조회 전용 역할에서는 종료 정보를 변경할 수 없습니다.</Typography>}
      </OpsSectionCard>

      <Grid className="gap-[var(--space-6)] xl:grid-cols-2">
        <OpsSectionCard title="인시던트 타임라인" description="감지·배포·로그·운영 조치의 상관관계를 시간순으로 확인합니다.">
          {timelineQuery.isLoading ? <OpsSectionSkeleton rows={4} /> : <IncidentTimeline items={timelineQuery.data ?? []} />}
        </OpsSectionCard>

        <OpsSectionCard title="관련 로그 (최근 30개)">
          <IssueLogList logs={issue.logs} />
        </OpsSectionCard>

        <OpsSectionCard title="메모 / 댓글">
          {canOperate ? (
            <IssueCommentsPanel
              comments={issue.comments}
              form={commentForm}
              isSubmitting={commentMutation.isPending}
              onSubmit={(values) => commentMutation.mutate(values)}
            />
          ) : (
            <Box className="mt-[var(--space-3)]">
              <Typography as="p" variant="bodySm" color="muted">조회 전용 역할에서는 메모를 추가할 수 없습니다.</Typography>
              <IncidentTimeline items={timelineQuery.data?.filter((item) => item.kind === "comment") ?? []} />
            </Box>
          )}
        </OpsSectionCard>
      </Grid>
    </OpsPageShell>
  );
}
