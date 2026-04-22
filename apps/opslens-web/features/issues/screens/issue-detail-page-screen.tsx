"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { Box, Button, Flex, Grid, Input, Label, Select, Spinner, StateView, Textarea, Typography } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import {
  addIssueComment,
  assignIssue,
  getIssueDetail,
  type IssueStatus,
  updateIssueStatus
} from "@repo/opslens";
import { OpsInfoItem, OpsIssueDetailSkeleton, OpsPageShell, OpsSectionCard } from "@/features";
import { formatDateTime, formatNumber } from "@repo/utils";
import { opslensQueryKeys } from "@repo/opslens";

const statusOptions: Array<{ label: string; value: IssueStatus }> = [
  { label: "신규", value: "new" },
  { label: "분석중", value: "analyzing" },
  { label: "대응중", value: "in_progress" },
  { label: "해결", value: "resolved" }
];

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const issueId = params.id;
  const queryClient = useQueryClient();

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

  const assignee = assigneeForm.watch("assignee");
  const commentBody = commentForm.watch("body");

  const issueQuery = useQuery({
    queryKey: opslensQueryKeys.issueDetail(issueId),
    staleTime: 10 * 1000,
    queryFn: () => getIssueDetail(issueId),
    enabled: Boolean(issueId)
  });

  const issue = issueQuery.data;

  const statusMutation = useMutation({
    mutationFn: (status: IssueStatus) => updateIssueStatus(issueId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.issueDetail(issueId) }),
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.all })
      ]);
    }
  });

  const assigneeMutation = useMutation({
    mutationFn: (values: { assignee: string }) => assignIssue(issueId, values.assignee.trim()),
    onSuccess: async () => {
      assigneeForm.reset({ assignee: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.issueDetail(issueId) }),
        queryClient.invalidateQueries({ queryKey: opslensQueryKeys.all })
      ]);
    }
  });

  const commentMutation = useMutation({
    mutationFn: (values: { author: string; body: string }) =>
      addIssueComment(issueId, values.author.trim() || "익명", values.body.trim()),
    onSuccess: async () => {
      commentForm.setValue("body", "");
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.issueDetail(issueId) });
    }
  });

  const statusLabel = useMemo(() => {
    if (!issue) return "-";
    if (issue.status === "new") return "신규";
    if (issue.status === "analyzing") return "분석중";
    if (issue.status === "in_progress") return "대응중";
    return "해결";
  }, [issue]);

  if (issueQuery.isLoading) {
    return <OpsIssueDetailSkeleton />;
  }

  if (issueQuery.isError || !issue) {
    return <StateView variant="error" size="lg" title="이슈 상세 조회에 실패했습니다." />;
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
        </Grid>
      </OpsSectionCard>

      <Grid className="gap-[var(--space-6)] xl:grid-cols-2">
        <OpsSectionCard title="상태/담당자 관리">
          <Grid className="mt-[var(--space-3)] gap-[var(--space-3)] md:grid-cols-2">
            <Grid className="gap-[var(--space-1)]">
              <Label htmlFor="issue-status">상태 변경</Label>
              <Select
                options={statusOptions}
                value={issue.status}
                onChange={(value) => statusMutation.mutate(String(value) as IssueStatus)}
                disabled={statusMutation.isPending}
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
                  disabled={assigneeMutation.isPending || assignee.trim().length === 0}
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

      <Grid className="gap-[var(--space-6)] xl:grid-cols-2">
        <OpsSectionCard title="관련 로그 (최근 30개)">
          {issue.logs.length === 0 ? (
            <StateView variant="empty" size="sm" title="로그 데이터가 없습니다." className="mt-[var(--space-3)]" />
          ) : (
            <Box className="mt-[var(--space-3)] max-h-[360px] space-y-[var(--space-2)] overflow-auto pr-1">
              {issue.logs.map((log) => (
                <Box key={log.id} className="border-default rounded-lg border p-[var(--space-3)]">
                  <Box as="p" className="text-muted-foreground text-caption">
                    {formatDateTime(log.occurredAt)} · {log.source} · {log.level}
                  </Box>
                  <Box as="p" className="text-foreground mt-[var(--space-1)] whitespace-pre-wrap break-all font-mono text-caption">
                    {log.rawMessage}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </OpsSectionCard>

        <OpsSectionCard title="메모 / 댓글">
          <form
            className="mt-[var(--space-3)] grid gap-[var(--space-2)]"
            onSubmit={commentForm.handleSubmit((values) => commentMutation.mutate(values))}
          >
            <Input
              id="comment-author"
              placeholder="작성자"
              size="md"
              control={commentForm.control}
              name="author"
            />
            <Textarea
              id="comment-body"
              rows={4}
              placeholder="운영 메모/분석 결과를 입력하세요"
              control={commentForm.control}
              name="body"
            />
            <Button
              type="submit"
              disabled={commentMutation.isPending || commentBody.trim().length === 0}
              variant="secondary"
              className="w-fit"
              loading={commentMutation.isPending ? true : undefined}
            >
              댓글 등록
            </Button>
          </form>

          <Box className="mt-[var(--space-4)] space-y-[var(--space-2)]">
            {issue.comments.length === 0 ? (
              <StateView variant="empty" size="sm" title="등록된 댓글이 없습니다." />
            ) : (
              issue.comments.map((comment) => (
                <Box key={comment.id} className="border-default rounded-lg border p-[var(--space-3)] text-sm">
                  <Box as="p" className="text-foreground font-semibold">{comment.author}</Box>
                  <Box as="p" className="text-muted mt-[var(--space-1)] whitespace-pre-wrap">{comment.body}</Box>
                  <Box as="p" className="text-muted-foreground mt-[var(--space-1)] text-caption">{formatDateTime(comment.createdAt)}</Box>
                </Box>
              ))
            )}
          </Box>
        </OpsSectionCard>
      </Grid>

      <Spinner
        open={statusMutation.isPending || assigneeMutation.isPending || commentMutation.isPending}
        fullscreen
        size="lg"
        color="primary"
      />
    </OpsPageShell>
  );
}
